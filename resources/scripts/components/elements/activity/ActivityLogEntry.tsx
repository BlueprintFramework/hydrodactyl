import type { ActivityLog } from '@definitions/user';
import { TerminalLine } from '@gravity-ui/icons';
// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from 'react-router-dom';

import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { useTranslation } from '@/i18n/I18nProvider';

import { formatObjectToIdentString } from '@/lib/objects';

import useLocationHash from '@/plugins/useLocationHash';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

const ActivityLogEntry = ({ activity, children }: Props) => {
    const { t, dateFnsLocale } = useTranslation();
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;

    return (
        <div className='flex items-center gap-3 py-3'>
            <div className='h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-700'>
                {actor?.image ? (
                    <img src={actor.image} alt={actor.username || t('server.activity.system')} className='h-full w-full object-cover' />
                ) : (
                    <div className='flex h-full w-full items-center justify-center text-xs font-medium text-zinc-300'>
                        {(actor?.username || 'S').charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2 text-sm'>
                    <span className='truncate text-zinc-100'>{actor?.username || t('server.activity.system')}</span>
                    <Link
                        to={`#${pathTo({ event: activity.event })}`}
                        className='truncate font-mono text-xs text-zinc-400 hover:text-zinc-100'
                    >
                        {activity.event}
                    </Link>
                    <div className='ml-auto flex shrink-0 items-center gap-2'>
                        {activity.isApi && (
                            <span className='flex items-center gap-1 text-xs text-zinc-500'>
                                <TerminalLine width={14} height={14} fill='currentColor' />
                                API
                            </span>
                        )}
                        {children}
                    </div>
                </div>

                {/* Translated event description */}
                {activity.descriptionParts ? (
                    <div className='text-sm text-zinc-300 mt-1 break-words'>
                        {activity.descriptionParts.map((part, index) =>
                            part.type === 'value' ? (
                                <CopyOnClick key={index} text={part.content}>
                                    <span
                                        className='inline-block max-w-full align-middle truncate font-mono text-xs bg-zinc-800/50 text-zinc-300 px-2 py-1 rounded transition-colors duration-150 hover:bg-zinc-700/50 hover:text-brand'
                                        title={part.content}
                                    >
                                        {part.content}
                                    </span>
                                </CopyOnClick>
                            ) : (
                                <span key={index}>{part.content}</span>
                            ),
                        )}
                    </div>
                ) : (
                    activity.description && (
                        <div className='text-sm text-zinc-300 mt-1 break-words'>{activity.description}</div>
                    )
                )}

                <div className='mt-0.5 flex items-center gap-3 text-xs text-zinc-500'>
                    {activity.ip && <span className='font-mono'>{activity.ip}</span>}
                    <span>{formatDistanceToNowStrict(activity.timestamp, { addSuffix: true, locale: dateFnsLocale })}</span>
                    {!activity.hasAdditionalMetadata &&
                        activity.properties &&
                        Object.keys(activity.properties).length > 0 && (
                            <span className='max-w-xs truncate'>{formatObjectToIdentString(activity.properties)}</span>
                        )}
                </div>
            </div>

            {/* Metadata button */}
            {activity.hasAdditionalMetadata && (
                <div className='flex-shrink-0 ml-2'>
                    <ActivityLogMetaButton meta={activity.properties} />
                </div>
            )}
        </div>
    );
};

export default ActivityLogEntry;
