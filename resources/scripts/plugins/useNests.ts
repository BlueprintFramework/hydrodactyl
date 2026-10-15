import useSWR from 'swr';
import getNests, { type Nest } from '@/api/nests/getNests';

export const useNests = () =>
    useSWR<Nest[]>('nests', getNests, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });
