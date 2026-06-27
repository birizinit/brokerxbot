import type { ReactNode } from "react"

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  sub?: ReactNode
  tone?: "default" | "up" | "down"
}

export function MetricCard({ icon, label, value, sub, tone = "default" }: MetricCardProps) {
  return (
    <div className="card metric">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-ic">{icon}</span>
      </div>
      <div className={`metric-value num ${tone}`}>{value}</div>
      {sub != null && <div className="metric-sub">{sub}</div>}
    </div>
  )
}
