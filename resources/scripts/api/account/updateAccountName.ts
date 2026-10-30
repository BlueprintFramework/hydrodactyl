import http from '@/api/http';

export default (firstName: string, lastName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.put('/api/client/account/name', {
            first_name: firstName,
            last_name: lastName,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
