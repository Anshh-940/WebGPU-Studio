interface StructuredIconProps {
  className?: string;
  size?: number;
}

/** JSON / structured data: document with braces/lines */
export function StructuredIcon({ className, size = 24 }: StructuredIconProps) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h2" />
      <path d="M8 17h4" />
      <path d="M8 9h1" />
    </svg>
  );
}
