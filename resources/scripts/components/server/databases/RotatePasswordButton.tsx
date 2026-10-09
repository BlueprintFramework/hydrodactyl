import { ArrowsRotateRight } from '@gravity-ui/icons';
import { type Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import type { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const RotatePasswordButton = ({
    databaseId,
    onUpdate,
}: {
    databaseId: string;
    onUpdate: (database: ServerDatabase) => void;
}) => {
    const [loading, setLoading] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const server = ServerContext.useStoreState((state) => state.server.data);

    if (!databaseId) {
        return null;
    }

    const rotate = () => {
        setLoading(true);
        clearFlashes();

        if (!server) return;
        rotateDatabasePassword(server.uuid, databaseId)
            .then((database) => {
                onUpdate(database);
                toast.success('A new password was generated');
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    type: 'error',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                    key: 'database-connection-modal',
                });
            })
            .then(() => {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            });
    };

    return (
        <Button onClick={rotate} size={'icon'} shape={'round'} className='flex-none'>
            <div className='flex justify-center items-center'>
                {!loading && <ArrowsRotateRight width={22} height={22} />}
                {loading && <Spinner size={'small'} />}
            </div>
        </Button>
    );
};

export default RotatePasswordButton;
