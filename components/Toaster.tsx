"use client"

import { useEffect, useState } from "react"
import { subscribeToasts, type ToastItem } from "@/lib/toast"
import { CheckIcon, CloseIcon, InfoIcon } from "@/components/icons"

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => subscribeToasts(setItems), [])

  if (items.length === 0) return null

  return (
    <div className="toaster">
      {items.map((t) => (
        <div key={t.id} className="toast" data-type={t.type}>
          <span className="toast-ic">
            {t.type === "success" ? <CheckIcon size={16} /> : t.type === "error" ? <CloseIcon size={16} /> : <InfoIcon size={16} />}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
