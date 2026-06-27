// Conjunto de ícones em SVG inline (stroke = currentColor).
// Sem emojis em nenhum lugar do app — apenas estes vetores.

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

function base(size = 20, strokeWidth = 1.8) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
}

export function KeyIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="3.5" />
      <path d="M10 13 20 3" />
      <path d="M16.5 6.5 19 9" />
      <path d="M13.5 9.5 16 12" />
    </svg>
  )
}

export function EyeIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M10.7 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.4 3.4" />
      <path d="M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.4-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  )
}

export function UserIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  )
}

export function MailIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function PhoneIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L19 18v3a1 1 0 0 1-1.1 1A16 16 0 0 1 3 6 1 1 0 0 1 5 4Z" />
    </svg>
  )
}

export function PowerIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M12 3v9" />
      <path d="M6.4 6.4a8 8 0 1 0 11.2 0" />
    </svg>
  )
}

export function BoltIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  )
}

export function ActivityIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M3 12h4l2 6 4-13 2 7h6" />
    </svg>
  )
}

export function WalletIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h12v3" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5" />
      <circle cx="16.5" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ArrowUpIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

export function ArrowDownIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M17 7 7 17" />
      <path d="M16 17H7V8" />
    </svg>
  )
}

export function CheckIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  )
}

export function CloseIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

export function ChevronRightIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function PlayIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M7 5v14l12-7-12-7Z" />
    </svg>
  )
}

export function InfoIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  )
}

export function LogoutIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 12H3" />
      <path d="m7 8-4 4 4 4" />
    </svg>
  )
}

export function ShieldIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.2 2.8 7.7 7 9 4.2-1.3 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function GridIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function RobotIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 4v4" />
      <circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <path d="M9.5 16.5h5" />
      <path d="M1.5 12v3M22.5 12v3" />
    </svg>
  )
}

export function ChartIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M4 4v16h16" />
      <path d="M7 14l3-4 3 2 4-6" />
    </svg>
  )
}

export function GearIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19" />
    </svg>
  )
}

export function CpuIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9 2.5v2M15 2.5v2M9 19.5v2M15 19.5v2M2.5 9h2M2.5 15h2M19.5 9h2M19.5 15h2" />
    </svg>
  )
}

export function TargetIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TrophyIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v3M9 20h6M10 20l.5-4M14 20l-.5-4" />
    </svg>
  )
}

export function LayersIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  )
}

export function FlameIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M12 3c1.5 3 4.5 4.5 4.5 8a4.5 4.5 0 0 1-9 0c0-1.2.4-2.2 1-3 .2 1 .8 1.6 1.5 1.8C9.7 8 11 6 12 3Z" />
    </svg>
  )
}

export function DollarIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M12 2.5v19" />
      <path d="M16 6.5c-1-1.2-2.5-1.8-4-1.8-2.2 0-3.8 1.2-3.8 3 0 4 8 2.2 8 6.2 0 1.9-1.7 3.2-4.2 3.2-1.7 0-3.3-.7-4.2-2" />
    </svg>
  )
}

export function ChevronDownIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function TrashIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function DownloadIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  )
}

export function SearchIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function BellIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
    </svg>
  )
}

export function ChevronLeftIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

export function AlertIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden="true">
      <path d="M12 3.5 2.5 20h19L12 3.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17.5h.01" />
    </svg>
  )
}

export function SpinnerIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.4" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
