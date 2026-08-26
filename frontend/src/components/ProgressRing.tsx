type Props = {
  pct: number
  size?: number
  stroke?: number
}

export default function ProgressRing({ pct, size = 56, stroke = 6 }: Props) {
  const clamped = Math.max(0, Math.min(100, pct))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (clamped / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-neutral-200 dark:stroke-night-500"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          className="stroke-accent-500"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-accent-500">{Math.round(clamped)}%</span>
    </div>
  )
}
