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
        viewBox="0 0 74 74"
        aria-hidden="true"
        focusable="false">
        <path className="team-v2-qr-badge__bracket" d="M18 27v-7a2 2 0 0 1 2-2h7M47 18h7a2 2 0 0 1 2 2v7M56 47v7a2 2 0 0 1-2 2h-7M27 56h-7a2 2 0 0 1-2-2v-7" />
        <g className="team-v2-qr-badge__glyph">
          <rect x="25" y="25" width="9" height="9" rx="1" />
          <rect x="40" y="25" width="9" height="9" rx="1" />
          <rect x="25" y="40" width="9" height="9" rx="1" />
          <path d="M40 40h4v4h-4zM45 45h4v4h-4zM40 47h3v3h-3z" />
        </g>
      </svg>
    </button>
  );
}
