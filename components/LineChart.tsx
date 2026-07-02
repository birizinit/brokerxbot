import type { BalancePoint } from "@/lib/types"

interface LineChartProps {
  points: BalancePoint[]
  height?: number
}

const W = 100
const H = 42

/** Gráfico de linha em SVG (pnl acumulado), com área preenchida e escala automática. */
export function LineChart({ points, height = 200 }: LineChartProps) {
  if (points.length < 2) {
    return (
      <div className="chart-empty" style={{ height }}>
        Sem dados suficientes — ative a IA para gerar histórico.
      </div>
    )
  }

  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const pad = (max - min) * 0.15
  min -= pad
  max += pad

  const n = points.length
  const x = (i: number) => (i / (n - 1)) * W
  const y = (v: number) => H - ((v - min) / (max - min)) * H

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(p.value).toFixed(2)}`).join(" ")
  const area = `${line} L ${W.toFixed(2)} ${H} L 0 ${H} Z`

  const last = values[n - 1]
  const positive = last >= 0
  const zeroY = y(0)
  const showZero = 0 >= min && 0 <= max

  return (
    <div className={`chart ${positive ? "up" : "down"}`} style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-svg">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {showZero && (
          <line
            x1="0"
            x2={W}
            y1={zeroY.toFixed(2)}
            y2={zeroY.toFixed(2)}
            className="chart-zero"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path d={area} fill="url(#chartFill)" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
