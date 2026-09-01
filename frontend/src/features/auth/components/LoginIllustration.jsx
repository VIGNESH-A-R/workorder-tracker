const CHECK_ROWS = [128, 168, 208, 248];

export default function LoginIllustration() {
  return (
    <svg viewBox="0 0 440 320" className="w-auto h-full max-h-full mx-auto" role="img" aria-hidden="true">
      {/* soft decorative shapes */}
      <circle cx="352" cy="80" r="90" fill="#FDBA74" opacity="0.3" />
      <circle cx="60" cy="248" r="50" fill="#FED7AA" opacity="0.5" />

      {/* clipboard clip */}
      <rect x="125" y="40" width="70" height="26" rx="8" fill="#F97316" />
      <rect x="140" y="32" width="40" height="16" rx="6" fill="#EA580C" />

      {/* clipboard body */}
      <rect x="70" y="56" width="180" height="228" rx="16" fill="#FFFFFF" stroke="#F97316" strokeWidth="4" />

      {/* checklist rows */}
      {CHECK_ROWS.map((y) => (
        <g key={y}>
          <circle cx="100" cy={y} r="13" fill="#F97316" />
          <path
            d={`M 94 ${y} L 98.5 ${y + 4.5} L 107 ${y - 5}`}
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="125" y={y - 4} width="95" height="8" rx="4" fill="#F1E4D8" />
        </g>
      ))}

      {/* simple abstract person, standing beside the clipboard */}
      <rect
        x="230"
        y="198"
        width="15"
        height="46"
        rx="7"
        fill="#F97316"
        transform="rotate(-28 237.5 198)"
      />
      <rect x="298" y="246" width="17" height="44" rx="7" fill="#475569" />
      <rect x="322" y="246" width="17" height="44" rx="7" fill="#475569" />
      <rect x="288" y="178" width="60" height="74" rx="18" fill="#F97316" />
      <circle cx="318" cy="161" r="19" fill="#F0C9A0" />
      <path d="M 300 154 A 18 18 0 0 1 336 154 Z" fill="#F97316" />
      <rect x="296" y="151" width="44" height="7" rx="3.5" fill="#EA580C" />
    </svg>
  );
}
