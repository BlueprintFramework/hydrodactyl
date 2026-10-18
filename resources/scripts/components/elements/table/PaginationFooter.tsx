import { ChevronLeft, ChevronRight } from '@gravity-ui/icons';
import clsx from 'clsx';
import type { PaginationDataSet } from '@/api/http';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    className?: string;
    pagination: PaginationDataSet;
    onPageSelect: (page: number) => void;
}

const PaginationFooter = ({ pagination, className, onPageSelect }: Props) => {
    const { t } = useTranslation();
    const start = (pagination.currentPage - 1) * pagination.perPage;
    const end = (pagination.currentPage - 1) * pagination.perPage + pagination.count;

    const { currentPage: current, totalPages: total } = pagination;

    const pages = { previous: [] as number[], next: [] as number[] };
    for (let i = 1; i <= 2; i++) {
        if (current - i >= 1) {
            pages.previous.push(current - i);
        }
        if (current + i <= total) {
            pages.next.push(current + i);
        }
    }

    if (pagination.total === 0) {
        return null;
    }

    const values: Record<string, number> = {
        start: Math.max(start, Math.min(pagination.total, 1)),
        end,
        total: pagination.total,
    };

    return (
        <div className={clsx('flex items-center justify-between my-2', className)}>
            <p className={'text-sm text-zinc-500'}>
                {t('common.pagination_showing')
                    .split(/(\{\{\w+\}\})/)
                    .map((part, index) => {
                        const match = /^\{\{(\w+)\}\}$/.exec(part);
                        const value = match ? values[match[1]] : undefined;

                        if (value !== undefined) {
                            return (
                                <span key={index} className={'font-semibold text-zinc-400'}>
                                    {value}
                                </span>
                            );
                        }

                        return part;
                    })}
            </p>
            {pagination.totalPages > 1 && (
                <div className={'flex space-x-1'}>
                    <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => onPageSelect(current - 1)}
                        disabled={current <= 1}
                        className=' p-0 flex items-center justify-center'
                    >
                        <ChevronLeft width={22} height={22} fill='currentColor' />
                    </Button>
                    {pages.previous.reverse().map((value) => (
                        <Button
                            key={`previous-${value}`}
                            variant='secondary'
                            size='sm'
                            onClick={() => onPageSelect(value)}
                            className='w-8 h-8 p-0 flex items-center justify-center'
                        >
                            {value}
                        </Button>
                    ))}
                    <Button size='sm' className='w-8 h-8 p-0 flex items-center justify-center' disabled>
                        {current}
                    </Button>
                    {pages.next.map((value) => (
                        <Button
                            key={`next-${value}`}
                            variant='secondary'
                            size='sm'
                            onClick={() => onPageSelect(value)}
                            className='w-8 h-8 p-0 flex items-center justify-center'
                        >
                            {value}
                        </Button>
                    ))}
                    <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => onPageSelect(current + 1)}
                        disabled={current >= total}
                        className='p-0 flex items-center justify-center'
                    >
                        <ChevronRight width={22} height={22} fill='currentColor' />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PaginationFooter;
