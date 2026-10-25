// Same artwork as brand/logo.svg, inline so the header doesn't wait on a request.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <rect width="128" height="128" rx="28" fill="var(--color-ink)" />
      <g transform="rotate(-18 64 64)">
        <path
          d="M24 44h58l22 20-22 20H24z"
          fill="var(--color-tag)"
          stroke="var(--color-tag)"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <circle cx="86" cy="64" r="6.5" fill="var(--color-ink)" />
        <path d="M36 56h30M36 72h18" stroke="var(--color-ink)" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  );
}
