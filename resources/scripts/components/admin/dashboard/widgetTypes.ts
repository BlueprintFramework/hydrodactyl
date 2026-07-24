import type { IconSvgElement } from '@hugeicons/react';
import type { ReactNode } from 'react';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WidgetSizeConfig {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

export interface WidgetType {
    id: string;
    title: string;
    icon: IconSvgElement;
    description: string;
    defaultSize: WidgetSize;
    sizes: Record<WidgetSize, WidgetSizeConfig>;
    render: (props: WidgetRenderProps) => ReactNode;
}

export interface WidgetRenderProps {
    isEditing: boolean;
    width?: number;
    height?: number;
}

export interface DashboardWidget {
    id: string;
    typeId: string;
    x: number;
    y: number;
    w: number;
    h: number;
    settings?: Record<string, unknown>;
}

export interface DashboardLayout {
    widgets: DashboardWidget[];
    version: number;
}

export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 80;
export const GRID_GAP = 16;

export const WIDGET_SIZES: Record<WidgetSize, WidgetSizeConfig> = {
    sm: { w: 3, h: 2, minW: 2, minH: 2 },
    md: { w: 4, h: 3, minW: 2, minH: 2 },
    lg: { w: 6, h: 3, minW: 3, minH: 2 },
    xl: { w: 8, h: 4, minW: 4, minH: 2 },
};
