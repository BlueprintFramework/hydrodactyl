export function normalizeBrandColor(value: string): string | null {
    const color = value.trim();
    if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) return null;

    return (
        color.length === 4 ? `#${[...color.slice(1)].map((digit) => digit + digit).join('')}` : color
    ).toUpperCase();
}
