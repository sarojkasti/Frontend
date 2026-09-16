import React, { useState, useEffect } from 'react';
import { Table, Spin, Empty, Pagination, Checkbox, Divider } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface MobileCardListProps<T = any> {
  dataSource: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyText?: string;
  className?: string;
  pagination?: any;
}

export function MobileCardList<T = any>({
  dataSource,
  renderCard,
  loading = false,
  emptyText = 'No data',
  className = '',
  pagination,
}: MobileCardListProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 w-full bg-white rounded-lg border border-gray-100">
        <Spin size="large" />
      </div>
    );
  }

  if (!dataSource || dataSource.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 py-8 px-4 text-center">
        <Empty description={emptyText} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <div
        className={`flex flex-col gap-3 ${className}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {dataSource.map((item, index) => (
          <div
            key={(item as any)?.key ?? (item as any)?.id ?? index}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 transition-shadow hover:shadow-md"
          >
            {renderCard(item, index)}
          </div>
        ))}
      </div>

      {pagination && pagination !== false && (
        <div className="flex justify-center py-4 bg-white rounded-lg border border-gray-100 mt-2">
          <Pagination
            size="small"
            showSizeChanger={false}
            {...(typeof pagination === 'object' ? pagination : {})}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Renders a default, highly readable card from Ant Design Table columns.
 */
function DefaultMobileCard<T = any>({
  record,
  index,
  columns,
  rowSelection,
}: {
  record: T;
  index: number;
  columns: (ColumnType<T> | any)[];
  rowSelection?: any;
}) {
  // Separate action columns from data columns
  const actionCols = columns.filter((col) => {
    const key = String(col.key || col.dataIndex || '').toLowerCase();
    const title = typeof col.title === 'string' ? col.title.toLowerCase() : '';
    return (
      key.includes('action') ||
      key.includes('operation') ||
      title.includes('action') ||
      title.includes('operation')
    );
  });

  const dataCols = columns.filter((col) => {
    const key = String(col.key || col.dataIndex || '').toLowerCase();
    const title = typeof col.title === 'string' ? col.title.toLowerCase() : '';
    return (
      !key.includes('action') &&
      !key.includes('operation') &&
      !title.includes('action') &&
      !title.includes('operation')
    );
  });

  const primaryCol = dataCols[0];
  const secondaryCols = dataCols.slice(1);

  const recordKey = (record as any)?.key ?? (record as any)?.id ?? index;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header: Checkbox + Primary column title/value + Status if any */}
      <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {rowSelection && (
            <div className="pt-0.5">
              <Checkbox
                checked={rowSelection.selectedRowKeys?.includes(recordKey)}
                onChange={(e) => {
                  if (rowSelection.onChange) {
                    const currentKeys = rowSelection.selectedRowKeys || [];
                    const newKeys = e.target.checked
                      ? [...currentKeys, recordKey]
                      : currentKeys.filter((k: any) => k !== recordKey);
                    rowSelection.onChange(newKeys, []);
                  }
                }}
              />
            </div>
          )}
          <div className="font-semibold text-gray-900 text-sm break-words flex-1">
            {primaryCol ? (
              primaryCol.render ? (
                primaryCol.render(
                  primaryCol.dataIndex ? (record as any)[primaryCol.dataIndex] : record,
                  record,
                  index
                )
              ) : primaryCol.dataIndex ? (
                String((record as any)[primaryCol.dataIndex] ?? '-')
              ) : (
                String(primaryCol.title || 'Item')
              )
            ) : (
              `Item #${index + 1}`
            )}
          </div>
        </div>
      </div>

      {/* Body: Key-Value pairs */}
      <div className="flex flex-col gap-2 text-xs">
        {secondaryCols.map((col, colIdx) => {
          const colTitle = typeof col.title === 'function' ? col.title({}) : col.title;
          const val = col.render
            ? col.render(
                col.dataIndex ? (record as any)[col.dataIndex] : record,
                record,
                index
              )
            : col.dataIndex
            ? (record as any)[col.dataIndex]
            : null;

          if (val === undefined || val === null || val === '') return null;

          return (
            <div
              key={col.key || col.dataIndex || colIdx}
              className="flex justify-between items-start gap-2 py-0.5"
            >
              <span className="text-gray-500 font-medium shrink-0 max-w-[40%] break-words">
                {colTitle || String(col.dataIndex || '')}:
              </span>
              <span className="text-gray-800 text-right font-normal break-words flex-1 min-w-0">
                {val}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer: Action buttons */}
      {actionCols.length > 0 && (
        <div className="border-t border-gray-100 pt-2.5 mt-1 flex flex-wrap justify-end gap-2 items-center">
          {actionCols.map((col, colIdx) => (
            <div key={col.key || colIdx} className="flex flex-wrap gap-2 items-center">
              {col.render
                ? col.render(
                    col.dataIndex ? (record as any)[col.dataIndex] : record,
                    record,
                    index
                  )
                : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type ResponsiveTableProps<T = any> = (
  | { tableProps: TableProps<T>; [key: string]: any }
  | (TableProps<T> & { tableProps?: undefined })
) & {
  renderMobileCard?: (record: T, index: number) => React.ReactNode;
  mobileRenderCard?: (record: T, index: number) => React.ReactNode;
  mobileBreakpoint?: number;
  forceTableOnMobile?: boolean;
};

export function ResponsiveTable<T = any>(props: ResponsiveTableProps<T>) {
  const {
    tableProps: explicitTableProps,
    renderMobileCard,
    mobileRenderCard,
    mobileBreakpoint = 768,
    forceTableOnMobile = false,
    ...restProps
  } = props;

  const actualTableProps = (explicitTableProps || restProps) as TableProps<T>;
  const activeRenderCard = mobileRenderCard || renderMobileCard;

  const { isMobile } = useIsMobile();
  const [customIsMobile, setCustomIsMobile] = useState(isMobile);

  useEffect(() => {
    if (mobileBreakpoint !== 768) {
      const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
      const handler = (e: MediaQueryListEvent) => setCustomIsMobile(e.matches);
      setCustomIsMobile(mql.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [mobileBreakpoint]);

  const effectiveIsMobile = mobileBreakpoint === 768 ? isMobile : customIsMobile;
  const isTableLoading =
    typeof actualTableProps.loading === 'object'
      ? actualTableProps.loading.spinning
      : (actualTableProps.loading as boolean);

  // If on mobile and not forced to table mode, ALWAYS render cards!
  if (effectiveIsMobile && !forceTableOnMobile) {
    const rawData = (actualTableProps.dataSource as T[]) || [];
    const columns = (actualTableProps.columns as any[]) || [];

    const cardRenderer =
      activeRenderCard ||
      ((record: T, index: number) => (
        <DefaultMobileCard
          record={record}
          index={index}
          columns={columns}
          rowSelection={actualTableProps.rowSelection}
        />
      ));

    return (
      <MobileCardList
        dataSource={rawData}
        renderCard={cardRenderer}
        loading={isTableLoading}
        emptyText={actualTableProps.locale?.emptyText as string}
        pagination={actualTableProps.pagination}
      />
    );
  }

  // Desktop view: untouched Ant Design Table
  return <Table<T> {...actualTableProps} />;
}

export default ResponsiveTable;
