import useSWR from 'swr';
import { getBucket, getBucketServers, getBuckets } from '@/api/admin/buckets';

export const useBuckets = (query: { page?: number; search?: string }) =>
    useSWR(['admin:buckets', query], () => getBuckets(query), {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

export const useBucket = (id?: number | string) =>
    useSWR(id ? ['admin:bucket', id] : null, () => getBucket(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useBucketServers = (id?: number | string) =>
    useSWR(id ? ['admin:bucket-servers', id] : null, () => getBucketServers(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });
