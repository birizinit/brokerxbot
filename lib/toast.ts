// Sistema simples de toasts (pub/sub), sem dependências.

export type ToastType = "success" | "error" | "info"

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let items: ToastItem[] = []
let listeners: Array<(t: ToastItem[]) => void> = []
let seq = 0

function emit() {
  for (const l of listeners) l(items)
}

export function toast(message: string, type: ToastType = "success") {
  const id = ++seq
  items = [...items, { id, message, type }]
  emit()
  setTimeout(() => {
    items = items.filter((t) => t.id !== id)
    emit()
  }, 3400)
}

export function subscribeToasts(listener: (t: ToastItem[]) => void): () => void {
  listeners.push(listener)
  listener(items)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}
