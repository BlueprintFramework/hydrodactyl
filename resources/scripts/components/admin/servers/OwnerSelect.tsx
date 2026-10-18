import { useState } from 'react';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { searchUsers } from '@/api/admin/servers';
import { Input } from '@/components/elements/inputs';
import { useTranslation } from '@/i18n/I18nProvider';

const OwnerSelect = ({
    initialLabel,
    onChange,
    error,
}: {
    initialLabel?: string;
    onChange: (id: number) => void;
    error?: string;
}) => {
    const { t } = useTranslation();
    const [label, setLabel] = useState(initialLabel ?? '');
    const [term, setTerm] = useState('');
    const [debounced] = useDebounce(term, 300);
    const { data, isValidating } = useSWR(
        debounced.length >= 2 ? ['admin:user-search', debounced] : null,
        () => searchUsers(debounced),
        { revalidateOnFocus: false },
    );

    const results = data ?? [];

    return (
        <div className='flex flex-col gap-2'>
            <div className='rounded-lg bg-[#ffffff11] px-4 py-2 text-sm text-cream-100'>
                {label || t('admin.servers.no_owner')}
            </div>
            <Input.Text
                placeholder={t('admin.servers.owner_search_placeholder')}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
            />
            {debounced.length >= 2 && (
                <div className='max-h-48 overflow-y-auto rounded-lg border border-mocha-400'>
                    {results.map((user) => (
                        <button
                            key={user.id}
                            type='button'
                            onClick={() => {
                                onChange(user.id);
                                setLabel(
                                    `${[user.name_first, user.name_last].filter(Boolean).join(' ')} (${user.email})`.trim(),
                                );
                                setTerm('');
                            }}
                            className='block w-full px-3 py-2 text-left text-sm hover:bg-mocha-400/40'
                        >
                            <span className='text-cream-100'>
                                {[user.name_first, user.name_last].filter(Boolean).join(' ') || user.username}
                            </span>{' '}
                            <span className='text-cream-400/60'>({user.email})</span>
                        </button>
                    ))}
                    {!isValidating && results.length === 0 && (
                        <div className='px-3 py-2 text-sm text-cream-400/50'>{t('admin.users.empty')}</div>
                    )}
                </div>
            )}
            {error && <span className='text-xs text-brand-600'>{error}</span>}
        </div>
    );
};

export default OwnerSelect;
