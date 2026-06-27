"use client"

import { useEffect } from "react"
import { AlertIcon, CloseIcon } from "@/components/icons"

interface AlertModalProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
}

export function AlertModal({ open, title, message, onClose }: AlertModalProps) {
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
    <div className="overlay" role="alertdialog" aria-modal="true">
      <div className="modal card">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon size={18} />
        </button>
        <div className="modal-ic err">
          <AlertIcon size={24} />
        </div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-msg">{message}</p>
        <button className="btn btn-accent btn-block" onClick={onClose}>
          Entendi
        </button>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
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
          max-width: 420px;
          padding: 28px;
          text-align: center;
          animation: rise 260ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
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
          width: 56px;
          height: 56px;
          border-radius: 16px;
          margin-bottom: 16px;
          color: var(--down);
          background: var(--down-soft);
          border: 1px solid rgba(255, 91, 91, 0.32);
        }
        .modal-title {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .modal-msg {
          color: var(--text-dim);
          font-size: 14px;
          margin: 8px 0 22px;
          line-height: 1.55;
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
