import { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

type IconSvgElement = readonly (readonly [string, {
    readonly [key: string]: string | number;
}])[];
type SVGAttributes = Partial<SVGProps<SVGSVGElement>>;
type ComponentAttributes = RefAttributes<SVGSVGElement> & SVGAttributes;
interface HugeiconsProps extends ComponentAttributes {
    size?: string | number;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
    altIcon?: IconSvgElement;
    showAlt?: boolean;
    icon?: IconSvgElement;
    primaryColor?: string;
    secondaryColor?: string;
    disableSecondaryOpacity?: boolean;
}
interface HugeiconsIconProps extends Omit<HugeiconsProps, 'ref' | 'altIcon'> {
    icon: IconSvgElement;
    altIcon?: IconSvgElement;
}
type HugeiconsIcon = ForwardRefExoticComponent<HugeiconsProps>;
declare const HugeiconsIcon: ForwardRefExoticComponent<HugeiconsIconProps & RefAttributes<SVGSVGElement>>;

export { HugeiconsIcon, HugeiconsIconProps, HugeiconsProps, IconSvgElement, SVGAttributes, HugeiconsIcon as default };
