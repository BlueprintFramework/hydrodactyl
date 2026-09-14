import { Database, Eye, TrashBin } from '@gravity-ui/icons';
import { useState } from 'react';
import type { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import DatabaseConnectionModal from '@/components/server/databases/DatabaseConnectionModal';
import DeleteDatabaseModal from '@/components/server/databases/DeleteDatabaseModal';
import { Button } from '@/components/ui/button';
import { ServerContext } from '@/state/server';

interface Props {
    database: ServerDatabase;
}

const DatabaseRow = ({ database }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const [visible, setVisible] = useState(false);
    const [connectionVisible, setConnectionVisible] = useState(false);

    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);
    const removeDatabase = ServerContext.useStoreActions((actions) => actions.databases.removeDatabase);

    if (uuid === undefined) {
        return null;
    }

    return (
        <>
            <DeleteDatabaseModal
                database={database}
                visible={visible}
                onDismissed={() => setVisible(false)}
                onDeleted={removeDatabase}
            />

            <DatabaseConnectionModal
                database={database}
                visible={connectionVisible}
                onDismissed={() => setConnectionVisible(false)}
                onRotate={appendDatabase}
            />

            <div className='flex items-center gap-3 w-full'>
                <div className='shrink-0 w-5' />
                <div className='shrink-0 w-9 h-9 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                    <Database width={22} height={22} fill='currentColor' className='text-zinc-400' />
                </div>

                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1.5'>
                        <CopyOnClick text={database.name}>
                            <h3 className='text-sm font-medium text-zinc-100 font-mono truncate cursor-pointer hover:text-zinc-50 transition-colors'>
                                {database.name}
                            </h3>
                        </CopyOnClick>
                    </div>
                    <CopyOnClick text={`${database.username}@${database.connectionString}`}>
                        <p className='text-xs text-zinc-400 font-mono truncate'>
                            {database.username}@{database.connectionString} · from {database.allowConnectionsFrom}
                        </p>
                    </CopyOnClick>
                </div>

                <div className='shrink-0 flex items-center gap-2 min-w-17 justify-end'>
                    <Button
                        variant='secondary'
                        size='sm'
                        className='p-2 h-10'
                        onClick={() => setConnectionVisible(true)}
                        title='Database connection details'
                    >
                        <Eye width={22} height={22} fill='currentColor' />
                    </Button>
                    <Can action={'database.delete'}>
                        <Button
                            variant='attention'
                            size='sm'
                            className='p-2 h-10'
                            onClick={() => setVisible(true)}
                            title='Delete database'
                        >
                            <TrashBin width={22} height={22} fill='currentColor' />
                        </Button>
                    </Can>
                </div>
            </div>
        </>
    );
};

export default DatabaseRow;
