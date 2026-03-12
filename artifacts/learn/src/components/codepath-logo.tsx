import { useId, CSSProperties } from "react";

interface CodePathLogoProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function CodePathLogo({ size = 36, className, style }: CodePathLogoProps) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      <polyline
        points="14,38 24,28 14,18"
        fill="none"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="28"
        y1="42"
        x2="50"
        y2="42"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const CodePathLogoIcon = CodePathLogo;
