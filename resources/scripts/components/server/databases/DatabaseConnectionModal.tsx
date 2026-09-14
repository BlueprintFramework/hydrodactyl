import type { MouseEvent } from 'react';
import styled from 'styled-components';
import type { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Input from '@/components/elements/Input';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import RotatePasswordButton from '@/components/server/databases/RotatePasswordButton';

const Label = styled.label`
  display: inline-block;
  color: #ffffff77;
  font-size: 0.875rem;
  padding-bottom: 0.5rem;
`;

interface Props extends RequiredModalProps {
    database: ServerDatabase;
    onRotate: (database: ServerDatabase) => void;
}

const DatabaseConnectionModal = ({ database, onRotate, visible, onDismissed, ...props }: Props) => {
    const jdbcConnectionString = `jdbc:mysql://${database.username}${database.password ? `:${encodeURIComponent(database.password)}` : ''}@${database.connectionString}/${database.name}`;

    const preventFocus = (e: MouseEvent<HTMLInputElement>) => e.preventDefault();

    return (
        <Modal
            visible={visible}
            onDismissed={onDismissed}
            {...props}
            title='Database connection details'
            closeButton={true}
        >
            <FlashMessageRender byKey={'database-connection-modal'} />
            <div className='flex flex-col min-w-full gap-4'>
                <div className='grid gap-4 sm:grid-cols-2 min-w-full'>
                    <div className='flex flex-col'>
                        <Label>Endpoint</Label>
                        <CopyOnClick text={database.connectionString}>
                            <Input
                                type={'text'}
                                readOnly
                                value={database.connectionString}
                                className='select-none'
                                onMouseDown={preventFocus}
                            />
                        </CopyOnClick>
                    </div>
                    <div className='flex flex-col'>
                        <Label>Connections from</Label>
                        <CopyOnClick text={database.allowConnectionsFrom}>
                            <Input
                                type={'text'}
                                readOnly
                                value={database.allowConnectionsFrom}
                                className='select-none'
                                onMouseDown={preventFocus}
                            />
                        </CopyOnClick>
                    </div>
                    <div className='flex flex-col'>
                        <Label>Username</Label>
                        <CopyOnClick text={database.username}>
                            <Input
                                type={'text'}
                                readOnly
                                value={database.username}
                                className='select-none'
                                onMouseDown={preventFocus}
                            />
                        </CopyOnClick>
                    </div>
                    <Can action={'database.view_password'}>
                        <div className='flex flex-col'>
                            <Label>Password</Label>
                            <div className='relative min-w-full'>
                                <CopyOnClick text={database.password} showInNotification={false}>
                                    <Input
                                        type={'password'}
                                        readOnly
                                        value={database.password}
                                        className='select-none w-full pr-12'
                                        onMouseDown={preventFocus}
                                    />
                                </CopyOnClick>
                                <Can action={'database.update'}>
                                    <div className='absolute right-1 top-1/2 -translate-y-1/2'>
                                        <RotatePasswordButton databaseId={database.id} onUpdate={onRotate} />
                                    </div>
                                </Can>
                            </div>
                        </div>
                    </Can>
                </div>
                <div className='flex flex-col'>
                    <div className='flex flex-row gap-2 align-middle items-center'>
                        <Label>JDBC Connection String</Label>
                    </div>
                    <CopyOnClick text={jdbcConnectionString} showInNotification={false}>
                        <Input
                            type={'password'}
                            readOnly
                            value={jdbcConnectionString}
                            className='select-none'
                            onMouseDown={preventFocus}
                        />
                    </CopyOnClick>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseConnectionModal;
