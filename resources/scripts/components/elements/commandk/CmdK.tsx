import {
    ArrowDownToLine,
    Box,
    BranchesDown,
    ClockArrowRotateLeft,
    CloudArrowUpIn,
    Database,
    FolderOpen,
    Gear,
    House,
    PencilToLine,
    Persons,
    Power,
    Terminal,
} from '@gravity-ui/icons';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import Can from '@/components/elements/Can';
import { useTranslation } from '@/i18n/I18nProvider';

import { ServerContext } from '@/state/server';

const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const navigate = useNavigate();
    const { t } = useTranslation();
    // controls server power status
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const cmdkPowerAction = (action: string) => {
        if (instance) {
            if (action === 'start') {
                toast.success(t('server.console.power_starting'));
            } else if (action === 'restart') {
                toast.success(t('server.console.power_restarting'));
            } else {
                toast.success(t('server.console.power_stopping'));
            }
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    const cmdkNavigate = (url: string) => {
        navigate(`/server/${id}${url}`);
        setOpen(false);
    };

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <Command.Dialog open={open} onOpenChange={setOpen} label={t('panel.command_menu')}>
            <Command.Input />
            <Command.List>
                <Command.Empty>{t('common.no_results')}</Command.Empty>

                <Command.Group heading={t('common.pages')}>
                    <Command.Item onSelect={() => cmdkNavigate('')}>
                        <House fill='currentColor' />
                        {t('navigation.home')}
                    </Command.Item>
                    <Can action={'file.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/files')}>
                            <FolderOpen fill='currentColor' />
                            {t('navigation.files')}
                        </Command.Item>
                    </Can>
                    <Can action={'database.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/databases')}>
                            <Database fill='currentColor' />
                            {t('navigation.databases')}
                        </Command.Item>
                    </Can>
                    <Can action={'backup.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/backups')}>
                            <CloudArrowUpIn fill='currentColor' />
                            {t('navigation.backups')}
                        </Command.Item>
                    </Can>
                    <Can action={'allocation.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/network')}>
                            <BranchesDown fill='currentColor' />
                            {t('navigation.networking')}
                        </Command.Item>
                    </Can>
                    <Can action={'user.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/users')}>
                            <Persons fill='currentColor' />
                            {t('navigation.users')}
                        </Command.Item>
                    </Can>
                    <Can action={['startup.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/startup')}>
                            <Terminal fill='currentColor' />
                            {t('navigation.startup')}
                        </Command.Item>
                    </Can>
                    <Can action={['schedule.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/schedules')}>
                            <ClockArrowRotateLeft fill='currentColor' />
                            {t('navigation.schedules')}
                        </Command.Item>
                    </Can>
                    <Can action={['settings.*', 'file.sftp']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/settings')}>
                            <Gear fill='currentColor' />
                            {t('navigation.settings')}
                        </Command.Item>
                    </Can>
                    <Can action={['activity.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/activity')}>
                            <PencilToLine fill='currentColor' />
                            {t('navigation.activity')}
                        </Command.Item>
                    </Can>
                    <Can action={['mod.download']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/installer')}>
                            <ArrowDownToLine fill='currentColor' />
                            {t('navigation.installer')}
                        </Command.Item>
                    </Can>
                    <Can action={['software.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/shell')}>
                            <Box fill='currentColor' />
                            {t('navigation.software')}
                        </Command.Item>
                    </Can>
                </Command.Group>
                <Command.Group heading={t('common.server')}>
                    <Can action={'control.start'}>
                        <Command.Item disabled={status !== 'offline'} onSelect={() => cmdkPowerAction('start')}>
                            <Power fill='currentColor' />
                            {t('server.console.start_server')}
                        </Command.Item>
                    </Can>
                    <Can action={'control.restart'}>
                        <Command.Item disabled={!status} onSelect={() => cmdkPowerAction('restart')}>
                            <Power fill='currentColor' />
                            {t('server.console.restart_server')}
                        </Command.Item>
                    </Can>
                    <Can action={'control.restart'}>
                        <Command.Item disabled={status === 'offline'} onSelect={() => cmdkPowerAction('stop')}>
                            <Power fill='currentColor' />
                            {t('server.console.stop_server')}
                        </Command.Item>
                    </Can>
                </Command.Group>
            </Command.List>
        </Command.Dialog>
    );
};

export default CommandMenu;
