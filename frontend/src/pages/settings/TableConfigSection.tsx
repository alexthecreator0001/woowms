import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTableConfig } from '../../hooks/useTableConfig';
import type { TableColumnDef } from '../../types';

const orderColumnDefs: TableColumnDef[] = [
  { id: 'order', label: 'Order' },
  { id: 'customer', label: 'Customer' },
  { id: 'status', label: 'Status' },
  { id: 'items', label: 'Items' },
  { id: 'total', label: 'Total' },
  { id: 'date', label: 'Date' },
];

const inventoryColumnDefs: TableColumnDef[] = [
  { id: 'image', label: 'Image' },
  { id: 'product', label: 'Product' },
  { id: 'price', label: 'Price' },
  { id: 'inStock', label: 'In Stock' },
  { id: 'reserved', label: 'Reserved' },
  { id: 'available', label: 'Available' },
  { id: 'location', label: 'Location' },
];

function ColumnList({
  title,
  columns,
  visibleIds,
  onToggle,
}: {
  title: string;
  columns: TableColumnDef[];
  visibleIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 px-6 py-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Toggle which columns appear in the table. At least 2 must remain visible.
        </p>
      </div>
      <div className="divide-y divide-border/40">
        {columns.map((col) => {
          const checked = visibleIds.includes(col.id);
          const disabled = checked && visibleIds.length <= 2;
          return (
            <button
              key={col.id}
              onClick={() => !disabled && onToggle(col.id)}
              disabled={disabled}
              className={cn(
                'flex w-full items-center gap-3 px-6 py-3 text-sm transition-colors',
                disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/40'
              )}
            >
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                  checked
                    ? 'border-primary bg-primary text-white'
                    : 'border-border/80 bg-background'
                )}
              >
                {checked && <Check className="h-3.5 w-3.5" />}
              </div>
              <span className="font-medium">{col.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TableConfigSection() {
  const orders = useTableConfig('orderColumns', orderColumnDefs);
  const inventory = useTableConfig('inventoryColumns', inventoryColumnDefs);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ColumnList
        title="Orders Table"
        columns={orderColumnDefs}
        visibleIds={orders.visibleIds}
        onToggle={orders.toggleColumn}
      />
      <ColumnList
        title="Inventory Table"
        columns={inventoryColumnDefs}
        visibleIds={inventory.visibleIds}
        onToggle={inventory.toggleColumn}
      />
    </div>
  );
}
