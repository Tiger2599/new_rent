'use client';

type Status = 'paid' | 'pending' | 'overdue';

const styles: Record<Status, string> = {
  paid: 'bg-mint-light/80 text-emerald-700',
  pending: 'bg-amber-50/80 text-amber-700',
  overdue: 'bg-red-50/80 text-red-600',
};

export function StatusBadge({ status }: { status: Status }) {
  const label = status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Overdue';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-pill text-xs font-medium ${styles[status]}`}>
      {label}
    </span>
  );
}
