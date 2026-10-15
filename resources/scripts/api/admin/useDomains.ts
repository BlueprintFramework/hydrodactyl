import useSWR from 'swr';
import { getDomains, getProviderSchema } from '@/api/admin/domains';

export const useDomains = () =>
    useSWR('admin:domains', getDomains, {
        revalidateOnFocus: false,
    });

export const useProviderSchema = (provider?: string) =>
    useSWR(provider ? ['admin:domain-provider', provider] : null, () => getProviderSchema(provider as string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });
