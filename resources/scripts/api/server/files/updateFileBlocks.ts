import http from '@/api/http';
import type { FileBlock } from '@/api/server/files/getFileBlocks';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, path: string, userUuids: string[]): Promise<FileBlock[]> => {
    return new Promise((resolve, reject) => {
        http.put(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/file-blocks`, {
            path,
            user_uuids: userUuids,
        })
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
