import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const getHashObject = (value: string): Record<string, string> =>
    value
        .substring(1)
        .split('&')
        .reduce((obj: Record<string, string>, str) => {
            const [key = '', value = ''] = str.split('=');

            if (!str.trim()) return obj;
            obj[key] = value;
            return obj;
        }, {});

export default () => {
    const location = useLocation();

    const pathTo = (params: Record<string, string>): string => {
        const current = getHashObject(location.hash);

        for (const key in params) {
            current[key] = params[key] ?? '';
        }

        return Object.keys(current)
            .map((key) => `${key}=${current[key]}`)
            .join('&');
    };

    const hash = useMemo((): Record<string, string> => getHashObject(location.hash), [location.hash]);

    return { hash, pathTo };
};
