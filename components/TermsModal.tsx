"use client"

import { useEffect, useState } from "react"
import { AlertIcon, CloseIcon, PowerIcon } from "@/components/icons"

interface TermsModalProps {
  open: boolean
  isDemo: boolean
  onAccept: () => void
  onClose: () => void
}

export function TermsModal({ open, isDemo, onAccept, onClose }: TermsModalProps) {
  const [checked, setChecked] = useState(false)

  // Reseta o checkbox cada vez que o modal abre.
  useEffect(() => {
    if (open) setChecked(false)
  }, [open])

  // Fecha com a tecla Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="modal card card-glow">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon size={18} />
        </button>

        <div className="modal-ic">
          <AlertIcon size={24} />
        </div>

        <h2 id="terms-title" className="modal-title">
          Termo de aceite
        </h2>
        <p className="modal-sub">
          Antes de ativar o robô, leia e aceite as condições de uso da automação de operações.
        </p>

        {!isDemo && (
          <div className="real-warn">
            <AlertIcon size={16} />
            <span>
              Você está em <b>conta REAL</b>. As operações usarão <b>saldo real</b> da sua conta na
              corretora.
            </span>
          </div>
        )}

        <ul className="terms-list">
          <li>
            O robô realiza operações de forma <b>automática</b> em ativos sorteados, no ritmo que você
            configurou.
          </li>
          <li>
            Operações financeiras envolvem <b>risco de perda</b>. Resultados passados não garantem
            resultados futuros.
          </li>
          <li>
            O robô <b>permanece ligado</b> até que você o desative manualmente. Ele não se desliga
            sozinho.
          </li>
          <li>
            Você é o <b>único responsável</b> pelas configurações, pelo capital aplicado e pelos
            resultados.
          </li>
        </ul>

        <label className="accept">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>Li e aceito os termos e estou ciente dos riscos.</span>
        </label>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-accent" disabled={!checked} onClick={onAccept}>
            <PowerIcon size={18} /> Aceitar e ativar
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(2, 4, 1, 0.72);
          backdrop-filter: blur(6px);
          animation: fade 200ms ease;
        }
        .modal {
          position: relative;
          width: 100%;
          max-width: 480px;
          padding: 28px;
          animation: rise 260ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-dim);
          cursor: pointer;
        }
        .modal-close:hover {
          color: var(--text);
        }
        .modal-ic {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 14px;
          color: var(--accent);
          background: var(--accent-soft);
          border: 1px solid var(--accent-line);
          margin-bottom: 16px;
        }
        .modal-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .modal-sub {
          color: var(--text-dim);
          font-size: 14px;
          margin-top: 6px;
        }
        .real-warn {
          display: flex;
          gap: 9px;
          align-items: flex-start;
          margin-top: 18px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          color: #ffd9a8;
          background: rgba(255, 170, 60, 0.1);
          border: 1px solid rgba(255, 170, 60, 0.32);
        }
        .real-warn :global(svg) {
          color: #ffb44d;
          flex-shrink: 0;
        }
        .terms-list {
          list-style: none;
          margin: 18px 0 4px;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .terms-list li {
          position: relative;
          padding-left: 22px;
          font-size: 13.5px;
          color: var(--text-dim);
          line-height: 1.5;
        }
        .terms-list li::before {
          content: "";
          position: absolute;
          left: 4px;
          top: 8px;
          width: 6px;
          height: 6px;
          border-radius: 99px;
          background: var(--accent);
        }
        .accept {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          padding: 13px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg);
          cursor: pointer;
          font-size: 13.5px;
        }
        .accept input {
          width: 18px;
          height: 18px;
          accent-color: var(--accent);
          cursor: pointer;
        }
        .modal-actions {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 10px;
          margin-top: 20px;
        }
        @keyframes fade {
          from {
            opacity: 0;
          }
        }
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
        }
      `}</style>
    </div>
  )
}
