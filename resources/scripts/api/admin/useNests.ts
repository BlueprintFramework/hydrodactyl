import useSWR from 'swr';
import { getEgg, getEggScripts, getEggVariables, getNest, getNests } from '@/api/admin/nests';

export const useNests = () => useSWR('admin:nests', getNests, { revalidateOnFocus: false });

export const useNest = (id?: number | string) =>
    useSWR(id ? ['admin:nest', id] : null, () => getNest(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useEgg = (id?: number | string) =>
    useSWR(id ? ['admin:egg', id] : null, () => getEgg(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useEggVariables = (id?: number | string) =>
    useSWR(id ? ['admin:egg-variables', id] : null, () => getEggVariables(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

export const useEggScripts = (id?: number | string) =>
    useSWR(id ? ['admin:egg-scripts', id] : null, () => getEggScripts(id as number | string), {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });
