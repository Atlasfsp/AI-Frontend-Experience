import { EmptyState } from './empty-state';
import { Card } from './card';

export interface Column<T> {
  className?: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  description,
  emptyDescription = 'Connect a live data source or enable mock mode to populate this table.',
  emptyTitle = 'No rows available',
  rows,
  title,
  footer,
}: {
  columns: Column<T>[];
  description?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  footer?: React.ReactNode;
  rows: T[];
  title: string;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="mt-2 text-sm text-slate-300">{description}</p> : null}
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-200">
            <thead className="bg-white/5">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className="px-6 py-3 font-medium uppercase tracking-[0.14em]"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.header} className={column.className ?? 'px-6 py-4 align-top'}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6">
          <EmptyState description={emptyDescription} title={emptyTitle} />
        </div>
      )}
      {footer ? <div className="border-t border-white/10 px-6 py-4">{footer}</div> : null}
    </Card>
  );
}
