/** Ilustración original de un piloto joven con auriculares de aviación y anteojos de sol sobre la frente. */
export function AvatarPiloto({ className = "h-28 w-28" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Avatar de un piloto joven con auriculares">
      <defs>
        <linearGradient id="cielo-avatar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0c4a6e" />
        </linearGradient>
        <clipPath id="circulo-avatar">
          <circle cx="60" cy="60" r="58" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#cielo-avatar)" />
      <g clipPath="url(#circulo-avatar)">
        {/* nube */}
        <ellipse cx="22" cy="34" rx="14" ry="6" fill="#fff" opacity=".35" />
        <ellipse cx="98" cy="26" rx="11" ry="5" fill="#fff" opacity=".3" />
        {/* hombros: camisa blanca de piloto con charreteras */}
        <path d="M14 120c2-22 20-32 46-32s44 10 46 32Z" fill="#f8fafc" />
        <path d="M24 98l16-6v6l-14 6Z M96 98l-16-6v6l14 6Z" fill="#0f172a" />
        <path d="M26 100l12-4.5M94 100l-12-4.5" stroke="#fbbf24" strokeWidth="1.5" />
        {/* cuello y corbata */}
        <path d="M50 84h20v8l-10 6-10-6Z" fill="#e0a57a" />
        <path d="M60 94l-4 4 4 18 4-18Z" fill="#0f172a" />
        {/* cara */}
        <ellipse cx="60" cy="62" rx="20" ry="23" fill="#f1b98c" />
        {/* pelo */}
        <path d="M40 58c-1-16 9-25 21-25 13 0 21 9 20 24-4-7-10-11-20-12-9 0-16 5-21 13Z" fill="#4a2c1a" />
        {/* anteojos de sol sobre la frente */}
        <rect x="44" y="43" width="14" height="7" rx="3.5" fill="#0f172a" />
        <rect x="62" y="43" width="14" height="7" rx="3.5" fill="#0f172a" />
        <path d="M58 46h4" stroke="#0f172a" strokeWidth="2" />
        <path d="M46 45l5 0" stroke="#38bdf8" strokeWidth="1" opacity=".7" />
        <path d="M64 45l5 0" stroke="#38bdf8" strokeWidth="1" opacity=".7" />
        {/* ojos, cejas y sonrisa */}
        <circle cx="52" cy="61" r="2.2" fill="#1e293b" />
        <circle cx="68" cy="61" r="2.2" fill="#1e293b" />
        <path d="M48 55.5q4-2 8 0M64 55.5q4-2 8 0" stroke="#4a2c1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M52 72q8 7 16 0" stroke="#7c2d12" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="47" cy="68" r="3" fill="#f43f5e" opacity=".15" />
        <circle cx="73" cy="68" r="3" fill="#f43f5e" opacity=".15" />
        {/* auriculares de aviación */}
        <path d="M37 60c0-19 10-29 23-29s23 10 23 29" stroke="#334155" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="31" y="56" width="10" height="16" rx="4" fill="#1e293b" />
        <rect x="79" y="56" width="10" height="16" rx="4" fill="#1e293b" />
        <rect x="32.5" y="59" width="7" height="10" rx="2.5" fill="#fbbf24" />
        <rect x="80.5" y="59" width="7" height="10" rx="2.5" fill="#fbbf24" />
        {/* micrófono */}
        <path d="M36 71c2 8 8 11 14 11" stroke="#334155" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="51" cy="82" r="3" fill="#0f172a" />
      </g>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
    </svg>
  );
}
