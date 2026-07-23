import http from '@/api/http';

export default (name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.put('/api/client/account/name', { name })
            .then(() => resolve())
            .catch(reject);
    });
};
