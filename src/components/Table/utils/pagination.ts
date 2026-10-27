import type { TablePaginationConfig } from "antd";

export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export const formatPaginationTotal = (total: number, range: [number, number]): string =>
  `${range[0]}-${range[1]} of ${total} items`;

export interface GlobalPaginationOptions extends TablePaginationConfig {
  persistenceKey?: string;
}

/**
 * Global Table Pagination Builder.
 * Standardizes pagination across the entire application:
 * - Hides pagination controls automatically when items fit on a single page (total <= pageSize)
 * - Preserves table-specific or user-chosen rows per page
 * - Provides standard 5, 10, 20, 50, 100 page size options
 * - Standardizes the "X-Y of Z items" total display
 */
export function getGlobalPaginationConfig(
  customPagination?: TablePaginationConfig | false | boolean,
  options?: {
    pageSize?: number;
    total?: number;
    dataSourceLength?: number;
    hideOnSinglePage?: boolean;
    forceShow?: boolean;
    isMobile?: boolean;
  }
): TablePaginationConfig | false {
  if (customPagination === false) return false;
  if (options?.isMobile) return false;

  const base = typeof customPagination === "object" ? customPagination : {};

  const totalCount =
    options?.total !== undefined
      ? options.total
      : base.total !== undefined
      ? base.total
      : options?.dataSourceLength !== undefined
      ? options.dataSourceLength
      : 0;

  const effectivePageSize =
    options?.pageSize || base.pageSize || base.defaultPageSize || 10;

  // The global rule requires auto-hiding when list count <= pageSize.
  // Unless explicitly requested via options.forceShow=true, we always hide on single page.
  const shouldHideOnSinglePage =
    options?.forceShow === true
      ? false
      : options?.hideOnSinglePage !== undefined
      ? options.hideOnSinglePage
      : true;

  // Auto-hide when data fits on one page (total <= pageSize)
  if (shouldHideOnSinglePage && totalCount <= effectivePageSize) {
    return false;
  }

  return {
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    showTotal: formatPaginationTotal,
    hideOnSinglePage: true,
    ...base,
    pageSize: effectivePageSize,
    total: totalCount,
  };
}
