import { forwardRef, createElement } from 'react';

const defaultAttributes = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
};
const HugeiconsIcon = forwardRef(({ color = 'currentColor', size = 24, strokeWidth, absoluteStrokeWidth = false, className = '', altIcon, showAlt = false, icon, primaryColor, secondaryColor, disableSecondaryOpacity = false, ...rest }, ref) => {
    const calculatedStrokeWidth = strokeWidth !== undefined
        ? (absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth)
        : undefined;
    const strokeProps = calculatedStrokeWidth !== undefined ? {
        strokeWidth: calculatedStrokeWidth,
        stroke: 'currentColor'
    } : {};
    const elementProps = {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        color: primaryColor || color,
        className,
        ...strokeProps,
        ...rest,
    };
    const currentIcon = (showAlt && altIcon) ? altIcon : icon;
    // Create SVG children with color handling for two-tone icons
    const svgChildren = [...currentIcon]
        .sort(([, a], [, b]) => {
        const hasOpacityA = a.opacity !== undefined;
        const hasOpacityB = b.opacity !== undefined;
        return hasOpacityB ? 1 : hasOpacityA ? -1 : 0;
    })
        .map(([tag, attrs]) => {
        const isSecondaryPath = attrs.opacity !== undefined;
        const pathOpacity = isSecondaryPath && !disableSecondaryOpacity ? attrs.opacity : undefined;
        // Handle both stroke and fill properties based on element type
        const fillProps = secondaryColor ? {
            ...(attrs.stroke !== undefined ? {
                stroke: isSecondaryPath ? secondaryColor : (primaryColor || color)
            } : {
                fill: isSecondaryPath ? secondaryColor : (primaryColor || color)
            })
        } : {};
        return createElement(tag, {
            ...attrs,
            ...strokeProps,
            ...fillProps,
            opacity: pathOpacity,
            key: attrs.key
        });
    });
    return createElement('svg', elementProps, svgChildren);
});
HugeiconsIcon.displayName = 'HugeiconsIcon';

export { HugeiconsIcon, HugeiconsIcon as default };
//# sourceMappingURL=HugeiconsIcon.js.map
