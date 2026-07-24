import { memo, type ReactNode, useMemo } from 'react';
import { noCompactor, ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';

import { type DashboardWidget, GRID_ROW_HEIGHT } from './widgetTypes';

const TABLET_COLS = 8;
const DESKTOP_COLS = 12;

interface DashboardGridProps {
    widgets: DashboardWidget[];
    children: (widget: DashboardWidget) => ReactNode;
}

function computeTabletLayout(widgets: DashboardWidget[]) {
    let cursor = 0;
    let currentY = 0;
    let rowHeight = 0;
    return widgets.map((w) => {
        const clampedW = Math.min(w.w, TABLET_COLS);
        if (cursor + clampedW > TABLET_COLS) {
            cursor = 0;
            currentY += rowHeight;
            rowHeight = 0;
        }
        const item = {
            i: w.id,
            x: cursor,
            y: currentY,
            w: clampedW,
            h: w.h,
            minW: 2,
            minH: 2,
            static: true as const,
        };
        cursor += clampedW;
        rowHeight = Math.max(rowHeight, w.h);
        return item;
    });
}

export const DashboardGrid = memo(({ widgets, children }: DashboardGridProps) => {
    const { containerRef, width, mounted } = useContainerWidth({ initialWidth: 1280 });

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
                static: true as const,
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
            <div ref={containerRef} className='w-full space-y-3'>
                {widgets.map((widget) => (
                    <div key={widget.id}>{children(widget)}</div>
                ))}
            </div>
        );
    }

    return (
        <div ref={containerRef} className='w-full'>
            {mounted && (
                <ResponsiveGridLayout
                    width={width}
                    layouts={layouts}
                    breakpoints={{ lg: 1024, md: 0 }}
                    cols={{ lg: DESKTOP_COLS, md: TABLET_COLS }}
                    rowHeight={width >= 1024 ? GRID_ROW_HEIGHT : 70}
                    margin={[width >= 1024 ? 16 : 12, width >= 1024 ? 16 : 12]}
                    dragConfig={{ enabled: false, bounded: false, threshold: 3 }}
                    resizeConfig={{ enabled: false, handles: ['se'] }}
                    compactor={noCompactor}
                >
                    {widgets.map((widget) => (
                        <div key={widget.id} className='transition-all duration-200'>
                            {children(widget)}
                        </div>
                    ))}
                </ResponsiveGridLayout>
            )}
        </div>
    );
});

DashboardGrid.displayName = 'DashboardGrid';
