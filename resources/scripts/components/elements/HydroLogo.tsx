// million-ignore
const Logo = ({ className, uniqueId }: { className?: string; uniqueId?: string } = {}) => {
    const customLogo = (window as Record<string, unknown>).SiteConfiguration?.logo as string | undefined;

    if (customLogo) {
        return (
            <img
                src={customLogo}
                alt='Logo'
                className={className || 'flex h-full w-full shrink-0 object-contain'}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
        );
    }

    const _gradientId = uniqueId
        ? `paint0_radial_${uniqueId}`
        : `paint0_radial_${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg
            className={className || 'flex h-full w-full shrink-0'}
            width='100'
            height='92'
            viewBox='0 0 100 92'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            role='img'
            aria-label='Hydrodactyl Logo'
        >
            <title>Hydrodactyl Logo</title>
            <g clip-path='url(#clip0_136_35)'>
                <path
                    d='M35.1293 92L39.2242 59.3897L44.8276 60.4695L14.2241 81.2019L0 57.0141L32.7586 45.3521V47.7277L0 33.4742L14.2241 8.85446L45.6896 33.2582L39.2242 34.1221L34.4828 0H65.5172L61.4225 33.9061L56.681 32.8263L85.7759 8.85446L100 33.4742L66.1638 47.7277V45.5681L99.569 57.0141L85.3448 81.2019L57.5431 59.3897H61.638L66.1638 92H35.1293Z'
                    fill='var(--brand-color)'
                />
            </g>
            <defs>
                <clipPath id='clip0_136_35'>
                    <rect width='100' height='92' fill='white' />
                </clipPath>
            </defs>
        </svg>
    );
};

export default Logo;

// vim: nowrap
