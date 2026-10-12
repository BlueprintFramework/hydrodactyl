import useSWR from 'swr';
import { getLocation, getLocations } from '@/api/admin/locations';

export const useLocations = () =>
    useSWR('admin:locations', getLocations, {
        revalidateOnFocus: false,
    });

export const useLocation = (id?: number | string) =>
    useSWR(id ? ['admin:location', id] : null, () => getLocation(id as number | string), {
        revalidateOnFocus: false,
    });
