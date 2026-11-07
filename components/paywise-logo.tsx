export function PaywiseMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Paywise">
      <rect width="32" height="32" rx="8" fill="#1c1917" />
      <path
        d="M8 22a8 8 0 0 1 8-8"
        fill="none"
        stroke="#f04438"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M16 14a8 8 0 0 1 8 8"
        fill="none"
        stroke="#22a34a"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M16 22 L21.6 15.4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="22" r="1.8" fill="#ffffff" />
    </svg>
  );
}

export function PaywiseLogo({
  className = "",
  markClassName = "h-7 w-7",
  wordClassName = "text-base",
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-stone-900 ${className}`}>
      <PaywiseMark className={markClassName} />
      <span className={`font-semibold tracking-tight ${wordClassName}`}>Paywise</span>
    </span>
  );
}
