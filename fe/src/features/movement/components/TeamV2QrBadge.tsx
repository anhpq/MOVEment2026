type TeamV2QrBadgeProps = Readonly<{
  ariaLabel: string;
  onClick: () => void;
}>;

export function TeamV2QrBadge({ariaLabel, onClick}: TeamV2QrBadgeProps) {
  return (
    <button
      type="button"
      className="team-v2-scan-button"
      aria-label={ariaLabel}
      onClick={onClick}>
      <svg
        className="team-v2-qr-badge"
        viewBox="0 0 120 120"
        aria-hidden="true"
        focusable="false">
        <defs>
          <radialGradient id="team-v2-qr-core" cx="50%" cy="42%" r="62%">
            <stop offset="0" stopColor="#17364a" stopOpacity="0.96" />
            <stop offset="0.58" stopColor="#081a28" stopOpacity="0.98" />
            <stop offset="1" stopColor="#02070d" />
          </radialGradient>
          <linearGradient id="team-v2-qr-cyan" x1="18" y1="18" x2="102" y2="86">
            <stop offset="0" stopColor="#d8ffff" />
            <stop offset="0.48" stopColor="#7df9ff" />
            <stop offset="1" stopColor="#1677ff" />
          </linearGradient>
          <linearGradient id="team-v2-qr-red" x1="26" y1="78" x2="94" y2="103">
            <stop offset="0" stopColor="#ff8b8c" />
            <stop offset="0.45" stopColor="#ff4d4f" />
            <stop offset="1" stopColor="#a90f22" />
          </linearGradient>
        </defs>

        <circle className="team-v2-qr-badge__halo" cx="60" cy="60" r="51" />
        <path className="team-v2-qr-badge__outer" d="M18 47A46 46 0 0 1 102 47" />
        <path className="team-v2-qr-badge__side" d="M13 55A48 48 0 0 0 20 81" />
        <path className="team-v2-qr-badge__side" d="M107 55A48 48 0 0 1 100 81" />
        <path className="team-v2-qr-badge__red" d="M24 82A43 43 0 0 0 96 82" />
        <path className="team-v2-qr-badge__red-core" d="M33 88A34 34 0 0 0 87 88" />

        <circle cx="60" cy="59" r="39" fill="url(#team-v2-qr-core)" />
        <circle className="team-v2-qr-badge__inner" cx="60" cy="59" r="37" />
        <path className="team-v2-qr-badge__bracket" d="M37 45v-8h12M83 45v-8H71M37 72v8h12M83 72v8H71" />

        <g className="team-v2-qr-badge__glyph">
          <path d="M42 48h11v11H42zm3 3v5h5v-5zM42 63h11v11H42zm3 3v5h5v-5zM56 48h8v8h-8zm3 3v2h2v-2z" fillRule="evenodd" />
          <path d="M56 59h4v4h-4zM61 64h4v4h-4zM56 69h4v5h-4zM62 58h3v4h-3z" />
        </g>
        <text className="team-v2-qr-badge__label" x="67" y="67">QR</text>
        <circle className="team-v2-qr-badge__spark" cx="89" cy="39" r="1.8" />
        <circle className="team-v2-qr-badge__spark" cx="30" cy="70" r="1.4" />
      </svg>
    </button>
  );
}
