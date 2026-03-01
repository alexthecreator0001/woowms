export interface StatusDef {
  value: string;
  label: string;
  color: string;
}

export const BUILT_IN_STATUSES: StatusDef[] = [
  { value: 'PENDING', label: 'Pending', color: 'amber' },
  { value: 'PROCESSING', label: 'Processing', color: 'sky' },
  { value: 'AWAITING_PICK', label: 'Awaiting Pick', color: 'blue' },
  { value: 'PICKING', label: 'Picking', color: 'violet' },
  { value: 'PICKED', label: 'Picked', color: 'purple' },
  { value: 'PACKING', label: 'Packing', color: 'orange' },
  { value: 'SHIPPED', label: 'Shipped', color: 'emerald' },
  { value: 'DELIVERED', label: 'Delivered', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'gray' },
];
