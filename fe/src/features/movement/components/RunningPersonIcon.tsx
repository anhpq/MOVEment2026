type RunningPersonIconProps = {
  className?: string;
};

export function RunningPersonIcon({className}: RunningPersonIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Running shoe"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 19.5c4.3.5 7.6-.6 10-3.2l2.7-3 3.1 6.2 4.6 1.2c1.2.3 2.1 1.4 2.1 2.7 0 1.5-1.2 2.6-2.7 2.6H7.4C5.5 26 4 24.5 4 22.6v-1.1c0-1.2.9-2.1 2-2Z"
        fill="currentColor"
      />
      <path
        d="M12.5 17.9 9.4 12.5 13 10l5.7 3.4M19 19.4l-6.4 1.1M22.4 20.2l-5.8 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M4.5 16.5h5M3.5 13h3.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
