interface AppLogoProps {
  size?: number;
  className?: string;
}

/** 颐语 Logo：圆角方 + 紫渐变 + 对话气泡 */
export default function AppLogo({ size = 32, className = '' }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="logoGrad" x1="8" y1="8" x2="40" y2="40">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#logoGrad)" />
      <path
        d="M14 18c0-2.2 1.8-4 4-4h12c2.2 0 4 1.8 4 4v6c0 2.2-1.8 4-4 4h-8l-4 4v-4h-4c-2.2 0-4-1.8-4-4v-6z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="20" cy="21" r="1.5" fill="#6D28D9" />
      <circle cx="24" cy="21" r="1.5" fill="#6D28D9" />
      <circle cx="28" cy="21" r="1.5" fill="#6D28D9" />
      <path
        d="M32 12l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5L32 12z"
        fill="#E9D5FF"
        fillOpacity="0.9"
      />
    </svg>
  );
}
