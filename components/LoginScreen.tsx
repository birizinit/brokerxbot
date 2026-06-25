"use client"

import { useState, type FormEvent } from "react"
import { validateKey } from "@/lib/api"
import {
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronRightIcon,
  PlayIcon,
  ShieldIcon,
  BoltIcon,
  ActivityIcon,
  SpinnerIcon,
  CloseIcon,
} from "@/components/icons"

interface LoginScreenProps {
  onLogin: (apiKey: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [apiKey, setApiKey] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [helpOpen, setHelpOpen] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const key = apiKey.trim()
    if (!key) {
      setError("Insira sua chave API para continuar.")
      return
    }

    setLoading(true)
    setError("")

    const result = await validateKey(key)
    if (result.ok) {
      onLogin(key)
    } else {
      setError(result.message)
      setLoading(false)
    }
  }

  return (
    <div className="center">
      <div className="auth">
        <div className="auth-head">
          <div className="auth-logo">
            <img src="/logo.png" alt="Logo" />
          </div>
          <h1 className="title">
            Central de <span className="accent">Operações</span>
          </h1>
          <p className="subtitle">Acesse com sua chave API para ativar o robô.</p>
        </div>

        <div className="card card-pad card-glow">
          <form onSubmit={handleSubmit} className="form-grid" noValidate>
            <div className="field">
              <label className="label" htmlFor="apiKey">
                <KeyIcon size={15} /> Chave API
              </label>
              <div className="input-wrap">
                <span className="lead">
                  <KeyIcon size={17} />
                </span>
                <input
                  id="apiKey"
                  className="input has-lead has-trail num"
                  type={show ? "text" : "password"}
                  placeholder="Cole sua chave API"
                  autoComplete="off"
                  spellCheck={false}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar chave" : "Mostrar chave"}
                  disabled={loading}
                >
                  {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                <CloseIcon size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
              {loading ? (
                <>
                  <SpinnerIcon className="spin" size={18} /> Validando...
                </>
              ) : (
                <>
                  Entrar <ChevronRightIcon size={18} />
                </>
              )}
            </button>
          </form>

          <div className="help">
            <button
              type="button"
              className="help-toggle"
              data-open={helpOpen}
              onClick={() => setHelpOpen((o) => !o)}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <PlayIcon size={16} /> Como obter minha chave API?
              </span>
              <ChevronRightIcon size={16} className="chev" />
            </button>

            <div className="help-panel" data-open={helpOpen}>
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
      `}</style>
    </div>
  )
}
