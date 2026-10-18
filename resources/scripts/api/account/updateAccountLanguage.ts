import http from '@/api/http';
import type { LocaleCode } from '@/i18n/types';

export default (language: LocaleCode): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.put('/api/client/account/language', { language })
            .then(() => resolve())
            .catch(reject);
    });
};
