/** Small inline spinner for buttons and overlays */
export function Spinner({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-10 w-10 border-2' : 'h-5 w-5 border-2';
  return (
    <span
      className={`inline-block animate-spin rounded-full border-primary-soft border-t-primary ${s} ${className}`}
      aria-hidden
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <Spinner size="lg" />
    </div>
  );
}
