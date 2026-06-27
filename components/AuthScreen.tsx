"use client"

import { useState, type FormEvent } from "react"
import { authLogin, authRegister } from "@/lib/api"
import {
  MailIcon,
  KeyIcon,
  UserIcon,
  PhoneIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronRightIcon,
  PlayIcon,
  SpinnerIcon,
  CloseIcon,
  ShieldIcon,
  BoltIcon,
  ActivityIcon,
} from "@/components/icons"

interface AuthScreenProps {
  onAuthed: () => void
}

type Mode = "login" | "register"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function AuthScreen({ onAuthed }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (mode === "register") {
      if (name.trim().length < 2) return setError("Informe seu nome completo.")
      if (!EMAIL_RE.test(email.trim())) return setError("Informe um e-mail válido.")
      if (phone.replace(/\D/g, "").length < 10) return setError("Informe um telefone válido com DDD.")
      if (password.length < 6) return setError("A senha precisa de ao menos 6 caracteres.")
      if (!apiKey.trim()) return setError("Cole sua chave API.")
    } else {
      if (!EMAIL_RE.test(email.trim())) return setError("Informe um e-mail válido.")
      if (!password) return setError("Informe sua senha.")
    }

    setLoading(true)
    const result =
      mode === "register"
        ? await authRegister({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, apiKey: apiKey.trim() })
        : await authLogin(email.trim(), password)

    if (result.ok) {
      onAuthed()
    } else {
      setError(result.error ?? "Não foi possível continuar.")
      setLoading(false)
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError("")
  }

  return (
    <div className="center">
      <div className="auth">
        <div className="auth-head">
          <div className="auth-logo">
            <img src="/logo-full.png" alt="Sniper Trader" className="logo-full" />
          </div>
          <p className="subtitle">Robô de operações automáticas</p>
        </div>

        <div className="card card-pad card-glow">
          <div className="seg auth-toggle">
            <button type="button" data-on={mode === "login"} onClick={() => switchMode("login")}>
              Entrar
            </button>
            <button type="button" data-on={mode === "register"} onClick={() => switchMode("register")}>
              Criar conta
            </button>
          </div>

          <form className="form-grid" onSubmit={submit} noValidate style={{ marginTop: 18 }}>
            {mode === "register" && (
              <div className="field">
                <label className="label">
                  <UserIcon size={15} /> Nome completo
                </label>
                <div className="input-wrap">
                  <span className="lead">
                    <UserIcon size={17} />
                  </span>
                  <input className="input has-lead" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            <div className="field">
              <label className="label">
                <MailIcon size={15} /> E-mail
              </label>
              <div className="input-wrap">
                <span className="lead">
                  <MailIcon size={17} />
                </span>
                <input
                  className="input has-lead"
                  type="email"
                  inputMode="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="field">
                <label className="label">
                  <PhoneIcon size={15} /> Telefone
                </label>
                <div className="input-wrap">
                  <span className="lead">
                    <PhoneIcon size={17} />
                  </span>
                  <input
                    className="input has-lead num"
                    inputMode="tel"
                    placeholder="(11) 90000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label className="label">
                <KeyIcon size={15} /> Senha
              </label>
              <div className="input-wrap">
                <span className="lead">
                  <KeyIcon size={17} />
                </span>
                <input
                  className="input has-lead has-trail"
                  type={showPass ? "text" : "password"}
                  placeholder={mode === "register" ? "Crie uma senha" : "Sua senha"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button type="button" className="input-action" onClick={() => setShowPass((s) => !s)} disabled={loading}>
                  {showPass ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="field">
                <label className="label">
                  <BoltIcon size={15} /> Chave API da corretora
                </label>
                <div className="input-wrap">
                  <span className="lead">
                    <BoltIcon size={17} />
                  </span>
                  <input
                    className="input has-lead has-trail num"
                    type={showKey ? "text" : "password"}
                    placeholder="Cole sua chave API"
                    autoComplete="off"
                    spellCheck={false}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={loading}
                  />
                  <button type="button" className="input-action" onClick={() => setShowKey((s) => !s)} disabled={loading}>
                    {showKey ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error" role="alert">
                <CloseIcon size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
              {loading ? (
                <>
                  <SpinnerIcon size={18} className="spin" /> {mode === "register" ? "Criando..." : "Entrando..."}
                </>
              ) : (
                <>
                  {mode === "register" ? "Criar conta e entrar" : "Entrar"} <ChevronRightIcon size={18} />
                </>
              )}
            </button>
          </form>

          {mode === "register" && (
            <div className="help">
              <button type="button" className="help-toggle" data-open={showHelp} onClick={() => setShowHelp((o) => !o)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                  <PlayIcon size={16} /> Como obter minha chave API?
                </span>
                <ChevronRightIcon size={16} className="chev" />
              </button>
              <div className="help-panel" data-open={showHelp}>
                <div className="video">
                  <iframe
                    src="https://www.youtube.com/embed/0M62A5oPVNA"
                    title="Como obter sua chave API"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="trust">
          <div className="trust-item">
            <ShieldIcon size={20} /> Seguro
          </div>
          <div className="trust-item">
            <BoltIcon size={20} /> Automático
          </div>
          <div className="trust-item">
            <ActivityIcon size={20} /> Tempo real
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.spin) {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .auth-toggle {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .auth-toggle button {
          padding: 10px;
        }
      `}</style>
    </div>
  )
}
