"use client"

import type { ReactNode } from "react"

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="switch"
      data-on={on}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    >
      <span className="switch-knob" />
    </button>
  )
}

interface SectionCardProps {
  icon?: ReactNode
  title: string
  sub?: string
  right?: ReactNode
  children: ReactNode
}

export function SectionCard({ icon, title, sub, right, children }: SectionCardProps) {
  return (
    <div className="card pad">
      <div className="card-head col">
        <div className="sc-titlewrap">
          <h3 className="disp-title">
            {icon} {title}
          </h3>
          {sub && <span className="sub">{sub}</span>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

export function ToggleRow({
  name,
  desc,
  on,
  onChange,
}: {
  name: string
  desc?: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button type="button" className="toggle-row" data-on={on} onClick={() => onChange(!on)}>
      <span className="tr-txt">
        <span className="tr-name">{name}</span>
        {desc && <span className="tr-desc">{desc}</span>}
      </span>
      <span className="switch" data-on={on} aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  )
}

interface SegOption {
  v: string | number
  label: string
}

export function SegRow({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string
  hint?: string
  options: SegOption[]
  value: string | number
  onChange: (v: string | number) => void
}) {
  return (
    <div className="config-row">
      <div className="head">
        <span className="k">{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      <div className="seg wrap">
        {options.map((o) => (
          <button key={String(o.v)} type="button" data-on={value === o.v} onClick={() => onChange(o.v)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
