import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export interface FileBlock {
    path: string;
    userUuid: string;
    username: string;
    createdAt: Date | null;
}

export default (uuid: string): Promise<FileBlock[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/file-blocks`)
            .then(({ data }) =>
                resolve(
                    (data.data || []).map((item: { attributes: Record<string, string> }) => ({
                        path: item.attributes.path,
                        userUuid: item.attributes.user_uuid,
                        username: item.attributes.username,
                        createdAt: item.attributes.created_at ? new Date(item.attributes.created_at) : null,
                    })),
                ),
            )
            .catch(reject);
    });
};
