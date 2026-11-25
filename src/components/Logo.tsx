/** Silueta de planeador vista desde arriba: alas largas y finas, fuselaje y cola en T. */
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
      <path d="M32 10c1.6 0 2.4 2 2.6 6l.3 9.2 27 2.6c1 .1 1.6.6 1.6 1.2s-.6 1-1.6 1.1l-26.9 2-.5 14 6.7 1.2c.7.1 1 .5 1 1s-.4.9-1 .9H22.8c-.6 0-1-.4-1-.9s.3-.9 1-1l6.7-1.2-.5-14-26.9-2C1 30 .5 29.6.5 29s.6-1.1 1.6-1.2l27-2.6.3-9.2c.2-4 1-6 2.6-6Z" />
    </svg>
  );
}
