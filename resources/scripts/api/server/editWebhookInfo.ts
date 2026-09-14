import http from '@/api/http';

export default (uuid: string, webhook_type: string, webhook_url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/webhook/`, { webhook_type, webhook_url })
            .then(() => resolve())
            .catch(reject);
    });
};
