import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

import http from '@/api/http';
import { type DashboardLayout, type DashboardWidget, GRID_COLS, WIDGET_SIZES, type WidgetSize } from './widgetTypes';

const STORAGE_KEY = 'admin:dashboard:layout';
const LAYOUT_VERSION = 1;

const getDashboardLayout = (): Promise<DashboardLayout> =>
    http.get('/api/application/panel/dashboard-layout').then(({ data }) => data as DashboardLayout);

const saveDashboardLayout = (layout: DashboardLayout): Promise<void> =>
    http.put('/api/application/panel/dashboard-layout', layout).then(() => undefined);

function getStoredLayout(): DashboardLayout | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as DashboardLayout;
        if (parsed.version === LAYOUT_VERSION) return parsed;
    } catch {
        // corrupt storage
    }
    return null;
}

function storeLayout(layout: DashboardLayout) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
        // storage full or disabled
    }
}

function clampPosition(widget: DashboardWidget): DashboardWidget {
    return {
        ...widget,
        x: Math.max(0, Math.min(widget.x, GRID_COLS - widget.w)),
        y: Math.max(0, widget.y),
    };
}

export function useDashboardLayout(defaultWidgets: DashboardWidget[]) {
    const [isEditing, setIsEditing] = useState(false);
    const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
        const stored = getStoredLayout();
        if (stored) return stored.widgets;
        return defaultWidgets;
    });

    const { data: remoteLayout, mutate: mutateRemote } = useSWR<DashboardLayout | null>(
        'admin:dashboard:layout',
        async () => {
            try {
                return await getDashboardLayout();
            } catch {
                return null;
            }
        },
        { revalidateOnFocus: false },
    );

    useEffect(() => {
        if (remoteLayout) {
            setWidgets(remoteLayout.widgets);
            storeLayout(remoteLayout);
        }
    }, [remoteLayout]);

    const saveLayout = useCallback(
        async (newWidgets: DashboardWidget[]) => {
            const layout: DashboardLayout = { widgets: newWidgets, version: LAYOUT_VERSION };
            setWidgets(layout.widgets);
            storeLayout(layout);

            try {
                const saved = await saveDashboardLayout(layout);
                await mutateRemote(saved ? { widgets: newWidgets, version: LAYOUT_VERSION } : null, {
                    revalidate: false,
                });
            } catch {
                // silently fail — local persistence still works
            }
        },
        [mutateRemote],
    );

    const addWidget = useCallback(
        (typeId: string, size: WidgetSize = 'md') => {
            const sizeConfig = WIDGET_SIZES[size];
            const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);

            const newWidget: DashboardWidget = {
                id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                typeId,
                x: 0,
                y: maxY,
                w: sizeConfig.w,
                h: sizeConfig.h,
            };

            saveLayout([...widgets, clampPosition(newWidget)]);
        },
        [widgets, saveLayout],
    );

    const removeWidget = useCallback(
        (widgetId: string) => {
            saveLayout(widgets.filter((w) => w.id !== widgetId));
        },
        [widgets, saveLayout],
    );

    const updateWidgetSettings = useCallback(
        (widgetId: string, settings: Record<string, unknown>) => {
            saveLayout(
                widgets.map((w) => (w.id === widgetId ? { ...w, settings: { ...w.settings, ...settings } } : w)),
            );
        },
        [widgets, saveLayout],
    );

    const onLayoutChange = useCallback(
        (newLayout: { i: string; x: number; y: number; w: number; h: number }[]) => {
            const updated = widgets.map((w) => {
                const match = newLayout.find((l) => l.i === w.id);
                if (!match) return w;
                return clampPosition({ ...w, x: match.x, y: match.y, w: match.w, h: match.h });
            });

            setWidgets(updated);
            storeLayout({ widgets: updated, version: LAYOUT_VERSION });
        },
        [widgets],
    );

    const handleStopDragging = useCallback(() => {
        const layout: DashboardLayout = { widgets, version: LAYOUT_VERSION };
        saveLayout(layout.widgets);
    }, [widgets, saveLayout]);

    const resetLayout = useCallback(() => {
        saveLayout(defaultWidgets);
    }, [defaultWidgets, saveLayout]);

    const toggleEditing = useCallback(() => {
        setIsEditing((prev) => !prev);
    }, []);

    return {
        widgets,
        isEditing,
        toggleEditing,
        addWidget,
        removeWidget,
        updateWidgetSettings,
        onLayoutChange,
        handleStopDragging,
        resetLayout,
    };
}
