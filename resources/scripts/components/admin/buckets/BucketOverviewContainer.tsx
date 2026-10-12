import { Link, useParams } from 'react-router-dom';
import { useBucket } from '@/api/admin/useBuckets';
import Spinner from '@/components/elements/Spinner';

const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <tr className='border-b border-mocha-400/40 last:border-0'>
        <td className='w-1/3 px-4 py-3 text-cream-400/70'>{label}</td>
        <td className='px-4 py-3 text-cream-100'>{children}</td>
    </tr>
);

const badge = (enabled: boolean) => (
    <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            enabled ? 'bg-hydro-500/20 text-hydro-400' : 'bg-mocha-300 text-cream-400'
        }`}
    >
        {enabled ? 'Enabled' : 'Disabled'}
    </span>
);

const BucketOverviewContainer = () => {
    const { id } = useParams<'id'>();
    const { data: bucket } = useBucket(id);

    if (!bucket) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='overflow-hidden rounded-xl border border-mocha-400 lg:col-span-2'>
                <table className='w-full text-sm'>
                    <tbody>
                        <Row label='ID'>
                            <code>{bucket.id}</code>
                        </Row>
                        <Row label='Name'>{bucket.name}</Row>
                        <Row label='Description'>{bucket.description || '—'}</Row>
                        <Row label='Bucket Name'>
                            <code>{bucket.bucket_name}</code>
                        </Row>
                        <Row label='Endpoint'>
                            {bucket.endpoint ? (
                                <code>{bucket.endpoint}</code>
                            ) : (
                                <span className='text-cream-400/50'>Default (AWS)</span>
                            )}
                        </Row>
                        <Row label='Region'>
                            <code>{bucket.region || 'us-east-1'}</code>
                        </Row>
                        <Row label='Path Style Endpoints'>{badge(bucket.use_path_style_endpoint)}</Row>
                        <Row label='Status'>{badge(bucket.enabled)}</Row>
                        <Row label='Created'>
                            {bucket.created_at ? new Date(bucket.created_at).toLocaleString() : '—'}
                        </Row>
                        <Row label='Updated'>
                            {bucket.updated_at ? new Date(bucket.updated_at).toLocaleString() : '—'}
                        </Row>
                    </tbody>
                </table>
            </div>

            <div className='flex flex-col gap-4'>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <p className='text-2xl font-semibold text-cream-50'>{bucket.servers_count}</p>
                    <p className='text-xs text-cream-400/60'>Attached Servers</p>
                    <Link
                        to={`/buckets/${bucket.id}/servers`}
                        className='mt-3 inline-block text-sm text-hydro-400 hover:text-hydro-300'
                    >
                        View Servers →
                    </Link>
                </div>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <p className='text-2xl font-semibold text-cream-50'>{formatBytes(bucket.storage_used)}</p>
                    <p className='text-xs text-cream-400/60'>Estimated Storage Usage</p>
                </div>
            </div>
        </div>
    );
};

export default BucketOverviewContainer;
