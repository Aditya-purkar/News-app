const SiteLogo = ({ className = 'h-14 w-14', compact = false }) => (
  <div className={`inline-flex items-center gap-3 ${compact ? 'gap-2' : 'gap-3'} `}>
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={className}
      role="img"
    >
      <defs>
        <linearGradient id="logoField" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d94f2b" />
          <stop offset="55%" stopColor="#c83b1f" />
          <stop offset="100%" stopColor="#7b2d1f" />
        </linearGradient>
        <linearGradient id="logoBar" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f6d7ae" />
          <stop offset="100%" stopColor="#fff7e8" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="88" height="88" rx="20" fill="url(#logoField)" />
      <rect x="16" y="18" width="64" height="8" rx="4" fill="#fff7e8" opacity="0.9" />
      <rect x="16" y="34" width="22" height="40" rx="4" fill="url(#logoBar)" />
      <rect x="44" y="42" width="12" height="32" rx="4" fill="url(#logoBar)" opacity="0.95" />
      <rect x="62" y="28" width="18" height="46" rx="4" fill="url(#logoBar)" />
      <path
        d="M16 62 C28 54, 39 56, 48 46 S68 31, 80 24"
        fill="none"
        stroke="#fff7e8"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="80" cy="24" r="5" fill="#fff7e8" />
    </svg>
    <div className={compact ? 'leading-none' : ''}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#7b5b2e]">
        ET NewsEra
      </p>
      {!compact ? (
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8b6d43]">
          Markets and AI Desk
        </p>
      ) : null}
    </div>
  </div>
);

export default SiteLogo;
