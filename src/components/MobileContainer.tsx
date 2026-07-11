export default function MobileContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-gray-100 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
