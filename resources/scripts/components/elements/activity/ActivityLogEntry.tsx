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
        <div className='flex items-center py-2 px-3 border-b border-zinc-800/30 last:border-0 group hover:bg-zinc-800/20 transition-colors duration-150'>
            {/* Compact Avatar */}
            <div className='flex-shrink-0 w-8 h-8 rounded-full bg-zinc-600 overflow-hidden mr-3'>
                {actor?.image ? (
                    <img
                        src={actor.image}
                        alt={actor.username || t('server.activity.system')}
                        className='w-full h-full object-cover'
                    />
                ) : (
                    <div className='w-full h-full flex items-center justify-center text-zinc-300 text-xs font-semibold'>
                        {(actor?.username || t('server.activity.system')).charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Main Content - Compact Layout */}
            <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 text-sm'>
                    <span className='font-medium text-zinc-100 truncate'>
                        {actor?.username || t('server.activity.system')}
                    </span>
                    <span className='text-zinc-500'>•</span>
                    <Link
                        to={`#${pathTo({ event: activity.event })}`}
                        className='font-mono text-xs bg-zinc-800/50 text-zinc-300 px-2 py-1 rounded hover:bg-zinc-700/50 hover:text-brand transition-colors duration-150 truncate'
                    >
                        {activity.event}
                    </Link>

                    {/* Compact badges */}
                    <div className='flex items-center gap-1 ml-auto'>
                        {activity.isApi && (
                            <span className='text-xs bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1'>
                                <TerminalLine width={22} height={22} fill='currentColor' />
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

                {/* Compact metadata and timestamp */}
                <div className='flex items-center gap-3 mt-1 text-xs text-zinc-400'>
                    {activity.ip && (
                        <span className='font-mono bg-zinc-800/30 px-1.5 py-0.5 rounded'>{activity.ip}</span>
                    )}
                    <span>
                        {formatDistanceToNowStrict(activity.timestamp, { addSuffix: true, locale: dateFnsLocale })}
                    </span>

                    {/* Inline properties for compact view */}
                    {!activity.hasAdditionalMetadata &&
                        activity.properties &&
                        Object.keys(activity.properties).length > 0 && (
                            <span className='text-zinc-500 truncate max-w-xs'>
                                {formatObjectToIdentString(activity.properties)}
                            </span>
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
