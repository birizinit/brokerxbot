"use client"

/** Gráficos leves (SVG/CSS puro) usados no painel administrativo. */

interface BarPoint {
  label: string // rótulo curto (ex.: "12/07")
  value: number
  title?: string // texto completo no hover
}

/** Gráfico de barras verticais responsivo (div-based). */
export function BarChart({ points, color = "var(--accent)", height = 180 }: { points: BarPoint[]; color?: string; height?: number }) {
  if (points.length === 0) {
    return <div className="a-chart-empty" style={{ height }}>Sem dados ainda.</div>
  }
  const max = Math.max(1, ...points.map((p) => p.value))

  return (
    <div className="a-bars" style={{ height }}>
      {points.map((p, i) => (
        <div className="a-bar-col" key={i} title={p.title ?? `${p.label}: ${p.value}`}>
          <div className="a-bar-track">
            <div
              className="a-bar-fill"
              style={{ height: `${(p.value / max) * 100}%`, background: color }}
            />
          </div>
          <span className="a-bar-lab">{p.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Área/linha de crescimento acumulado (SVG escalável). */
export function AreaLine({ values, color = "var(--accent)", height = 180 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) {
    return <div className="a-chart-empty" style={{ height }}>Sem dados suficientes.</div>
  }
  const W = 100
  const H = 42
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const n = values.length
  const x = (i: number) => (i / (n - 1)) * W
  const y = (v: number) => H - ((v - min) / span) * H * 0.92 - 2

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ")
  const area = `${line} L ${W} ${H} L 0 ${H} Z`

  return (
    <div className="a-line" style={{ height, color }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="a-line-svg">
        <defs>
          <linearGradient id="aGrowth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#aGrowth)" />
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

interface Segment {
  label: string
  value: number
  color: string
}

/** Rosca (donut) com legenda. */
export function Donut({ segments, centerLabel, centerValue }: { segments: Segment[]; centerLabel?: string; centerValue?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const R = 42
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="a-donut-wrap">
      <div className="a-donut">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} className="a-donut-bg" />
          {total > 0 &&
            segments.map((s, i) => {
              const frac = s.value / total
              const dash = frac * C
              const el = (
                <circle
                  key={i}
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 60 60)"
                  strokeLinecap="butt"
                />
              )
              offset += dash
              return el
            })}
        </svg>
        <div className="a-donut-center">
          <span className="a-donut-val">{centerValue ?? total}</span>
          {centerLabel && <span className="a-donut-lab">{centerLabel}</span>}
        </div>
      </div>
      <div className="a-donut-legend">
        {segments.map((s, i) => (
          <div className="a-legend-row" key={i}>
            <span className="a-legend-dot" style={{ background: s.color }} />
            <span className="a-legend-name">{s.label}</span>
            <span className="a-legend-val">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
