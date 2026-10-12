import { Link, useParams } from 'react-router-dom';
import { useBucketServers } from '@/api/admin/useBuckets';
import Spinner from '@/components/elements/Spinner';

const BucketServersContainer = () => {
    const { id } = useParams<'id'>();
    const { data } = useBucketServers(id);

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <div className='overflow-x-auto rounded-xl border border-mocha-400'>
            <table className='w-full text-sm'>
                <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                    <tr className='border-b border-mocha-400'>
                        <th className='px-4 py-3'>ID</th>
                        <th className='px-4 py-3'>Server Name</th>
                        <th className='px-4 py-3'>Owner</th>
                        <th className='px-4 py-3'>Service</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((server) => (
                        <tr key={server.id} className='border-b border-mocha-400/40'>
                            <td className='px-4 py-3 font-mono text-cream-400/60'>{server.uuid_short}</td>
                            <td className='px-4 py-3'>
                                <Link to={`/servers/${server.id}`} className='text-cream-50 hover:text-hydro-400'>
                                    {server.name}
                                </Link>
                            </td>
                            <td className='px-4 py-3'>
                                {server.owner ? (
                                    <Link
                                        to={`/users/${server.owner.id}`}
                                        className='text-cream-50 hover:text-hydro-400'
                                    >
                                        {server.owner.username}
                                    </Link>
                                ) : (
                                    'N/A'
                                )}
                            </td>
                            <td className='px-4 py-3 text-cream-400/70'>
                                {server.nest ?? 'N/A'} ({server.egg ?? 'N/A'})
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={4} className='px-4 py-6 text-center text-cream-400/50'>
                                No servers are using this S3 configuration.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BucketServersContainer;
