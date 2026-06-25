"use client"

import { useState, type FormEvent } from "react"
import type { Profile } from "@/lib/storage"
import { UserIcon, MailIcon, PhoneIcon, ChevronRightIcon } from "@/components/icons"

interface OnboardingProps {
  onComplete: (profile: Profile) => void
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (name.trim().length < 2) next.name = "Informe seu nome completo."
    if (!EMAIL_RE.test(email.trim())) next.email = "Informe um e-mail válido."
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone válido com DDD."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onComplete({ name: name.trim(), email: email.trim(), phone: phone.trim() })
  }

  const filled = [name.trim(), email.trim(), phone.trim()].filter(Boolean).length

  return (
    <div className="center">
      <div className="onb">
        <div className="progress" aria-hidden="true">
          <span data-on={filled >= 1} />
          <span data-on={filled >= 2} />
          <span data-on={filled >= 3} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <span className="kicker">Antes de começar</span>
          <h1 className="title" style={{ marginTop: 12 }}>
            Crie seu perfil
          </h1>
          <p className="subtitle">Esses dados identificam você dentro da central de operações.</p>
        </div>

        <div className="card card-pad card-glow">
          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="label" htmlFor="name">
                <UserIcon size={15} /> Nome completo
              </label>
              <div className="input-wrap">
                <span className="lead">
                  <UserIcon size={17} />
                </span>
                <input
                  id="name"
                  className="input has-lead"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {errors.name && <span className="hint down">{errors.name}</span>}
            </div>

            <div className="field">
              <label className="label" htmlFor="email">
                <MailIcon size={15} /> E-mail
              </label>
              <div className="input-wrap">
                <span className="lead">
                  <MailIcon size={17} />
                </span>
                <input
                  id="email"
                  className="input has-lead"
                  type="email"
                  inputMode="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <span className="hint down">{errors.email}</span>}
            </div>

            <div className="field">
              <label className="label" htmlFor="phone">
                <PhoneIcon size={15} /> Telefone
              </label>
              <div className="input-wrap">
                <span className="lead">
                  <PhoneIcon size={17} />
                </span>
                <input
                  id="phone"
                  className="input has-lead num"
                  inputMode="tel"
                  placeholder="(11) 90000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                />
              </div>
              {errors.phone && <span className="hint down">{errors.phone}</span>}
            </div>

            <button type="submit" className="btn btn-accent btn-block">
              Acessar central <ChevronRightIcon size={18} />
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .hint {
          font-size: 12.5px;
        }
      `}</style>
    </div>
  )
}
