import type { PaginatedResult } from '@/api/http';
import PaginationFooter from '@/components/elements/table/PaginationFooter';

interface RenderFuncProps<T> {
    items: T[];
    isLastPage: boolean;
    isFirstPage: boolean;
}

interface Props<T> {
    data: PaginatedResult<T>;
    showGoToLast?: boolean;
    showGoToFirst?: boolean;
    onPageSelect: (page: number) => void;
    children: (props: RenderFuncProps<T>) => React.ReactNode;
}

function Pagination<T>({ data: { items, pagination }, onPageSelect, children }: Props<T>) {
    const isFirstPage = pagination.currentPage === 1;
    const isLastPage = pagination.currentPage >= pagination.totalPages;

    return (
        <>
            {children({ items, isFirstPage, isLastPage })}
            <PaginationFooter pagination={pagination} onPageSelect={onPageSelect} className='mt-4 shrink-0' />
        </>
    );
}

export default Pagination;
