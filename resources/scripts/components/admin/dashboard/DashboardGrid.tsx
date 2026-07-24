import { memo, type ReactNode, useMemo } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';

import { type DashboardWidget, GRID_ROW_HEIGHT } from './widgetTypes';

const TABLET_COLS = 8;
const DESKTOP_COLS = 12;

interface DashboardGridProps {
    widgets: DashboardWidget[];
    isEditing: boolean;
    onLayoutChange: (layout: { i: string; x: number; y: number; w: number; h: number }[]) => void;
    onStopDragging: () => void;
    children: (widget: DashboardWidget) => ReactNode;
}

function computeTabletLayout(widgets: DashboardWidget[]) {
    return widgets.map((w) => ({
        i: w.id,
        x: Math.min(w.x, TABLET_COLS - Math.min(w.w, TABLET_COLS)),
        y: w.y,
        w: Math.min(w.w, TABLET_COLS),
        h: w.h,
        minW: 2,
        minH: 2,
    }));
}

export const DashboardGrid = memo(
    ({ widgets, isEditing, onLayoutChange, onStopDragging, children }: DashboardGridProps) => {
        const { ref, width } = useContainerWidth({ initialWidth: 1280 });

        const isMobile = width < 640;

        const desktopLayout = useMemo(
            () =>
                widgets.map((w) => ({
                    i: w.id,
                    x: w.x,
                    y: w.y,
                    w: w.w,
                    h: w.h,
                    minW: 2,
                    minH: 2,
                })),
            [widgets],
        );

        const tabletLayout = useMemo(() => computeTabletLayout(widgets), [widgets]);

        const layouts = useMemo(
            () => ({
                lg: desktopLayout,
                md: tabletLayout,
            }),
            [desktopLayout, tabletLayout],
        );

        if (isMobile) {
            return (
                <div ref={ref} className='space-y-3'>
                    {widgets.map((widget) => (
                        <div key={widget.id}>{children(widget)}</div>
                    ))}
                </div>
            );
        }

        return (
            <div ref={ref}>
                <ResponsiveGridLayout
                    width={width}
                    layouts={layouts}
                    breakpoints={{ lg: 1024, md: 0 }}
                    cols={{ lg: DESKTOP_COLS, md: TABLET_COLS }}
                    rowHeight={width >= 1024 ? GRID_ROW_HEIGHT : 70}
                    margin={[width >= 1024 ? 16 : 12, width >= 1024 ? 16 : 12]}
                    isDraggable={isEditing}
                    isResizable={isEditing}
                    draggableHandle='.drag-handle'
                    onLayoutChange={onLayoutChange}
                    onDragStop={onStopDragging}
                    onResizeStop={onStopDragging}
                    useCSSTransforms
                    compactType='vertical'
                    allowOverlap={false}
                >
                    {widgets.map((widget) => (
                        <div key={widget.id} className='transition-all duration-200'>
                            {children(widget)}
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>
        );
    },
);

DashboardGrid.displayName = 'DashboardGrid';
