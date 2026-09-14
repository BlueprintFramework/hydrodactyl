import http from '@/api/http';

export interface FilterOption {
    value: number;
    label: string;
}

export interface FilterOptions {
    owners: FilterOption[];
    nests: FilterOption[];
    eggs: FilterOption[];
    nodes: FilterOption[];
    groups: FilterOption[];
    groupsEnabled: boolean;
}

export default async (): Promise<FilterOptions> => {
    return new Promise((resolve, reject) => {
        http.get('/api/client/filter-options')
            .then(({ data }) =>
                resolve({
                    owners: data.attributes?.owners || [],
                    nests: data.attributes?.nests || [],
                    eggs: data.attributes?.eggs || [],
                    nodes: data.attributes?.nodes || [],
                    groups: data.attributes?.groups || [],
                    groupsEnabled: data.attributes?.groups_enabled ?? true,
                }),
            )
            .catch(reject);
    });
};
