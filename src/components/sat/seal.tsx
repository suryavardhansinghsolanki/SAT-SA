export function Seal({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="4" fill="currentColor" className="text-elevated" />
      <path
        d="M16 4.5 L26 9.2 V16.8 C26 22.1 21.8 26.6 16 28 C10.2 26.6 6 22.1 6 16.8 V9.2 Z"
        fill="none"
        stroke="currentColor"
        className="text-accent"
        strokeWidth="1.4"
      />
      <path d="M11 18.2 L15.1 22 L22 12.8" fill="none" stroke="currentColor" className="text-risk" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}
