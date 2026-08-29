interface EmbeddingsIconProps {
  className?: string;
  size?: number;
}

/** Vectors / embedding space: nodes with directional links */
export function EmbeddingsIcon({ className, size = 24 }: EmbeddingsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="6" cy="8" r="1.5" />
      <circle cx="18" cy="8" r="1.5" />
      <circle cx="6" cy="16" r="1.5" />
      <circle cx="18" cy="16" r="1.5" />
      <path d="M12 9.5v1" />
      <path d="M12 13v1" />
      <path d="M9.2 10.2 7.5 8.8" />
      <path d="M14.8 10.2l1.7-1.4" />
      <path d="M9.2 13.8 7.5 15.2" />
      <path d="M14.8 13.8l1.7 1.4" />
    </svg>
  );
}
