type RunningPersonIconProps = {
  className?: string;
};

export function RunningPersonIcon({className}: RunningPersonIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Running person"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <circle cx="19" cy="6" r="3" fill="currentColor" />
      <path
        d="M17.7 10.3 13.2 15l4.1 3.1 3.4 7.2"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 11.2 23.5 14l3.1-1.8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 15 8.8 14.2 6 17"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.7 18.4 11.3 22.2 6.8 25.7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10h6M3.5 15h4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
