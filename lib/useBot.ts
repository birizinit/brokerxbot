"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { openTrade } from "@/lib/api"
import { randomAsset } from "@/lib/assets"
import type { BotConfig } from "@/lib/storage"

export interface BotLogEntry {
  id: string
  time: number
  symbol: string
  direction: "BUY" | "SELL"
  amount: number
  isDemo: boolean
  status: "ok" | "error"
  message: string
}

const LOG_KEY = "bo_bot_log"
const MAX_LOG = 50
const MIN_INTERVAL_MS = 2000
const FIRST_DELAY_MS = 2500

function loadLog(): BotLogEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(LOG_KEY)
    return raw ? (JSON.parse(raw) as BotLogEntry[]) : []
  } catch {
    return []
  }
}

function saveLog(entries: BotLogEntry[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(0, MAX_LOG)))
}

function intervalFor(opsPerHour: number): number {
  const safe = Math.max(1, opsPerHour)
  return Math.max(MIN_INTERVAL_MS, Math.round(3_600_000 / safe))
}

function pickDirection(): "BUY" | "SELL" {
  return Math.random() < 0.5 ? "BUY" : "SELL"
}

interface UseBotResult {
  log: BotLogEntry[]
  nextRunAt: number | null
  clearLog: () => void
}

/**
 * Motor do bot. Enquanto `active` for true, agenda e envia operações no ritmo
 * definido por `config.opsPerHour`. NUNCA se desliga sozinho — só para quando
 * `active` vira false (ação do usuário). Mudanças de config valem no próximo ciclo.
 */
export function useBot(apiKey: string, config: BotConfig, active: boolean): UseBotResult {
  const [log, setLog] = useState<BotLogEntry[]>([])
  const [nextRunAt, setNextRunAt] = useState<number | null>(null)

  const configRef = useRef(config)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mantém a config sempre atualizada sem reiniciar o agendamento em curso.
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Carrega o log persistido apenas no cliente.
  useEffect(() => {
    setLog(loadLog())
  }, [])

  const pushEntry = useCallback((entry: BotLogEntry) => {
    setLog((prev) => {
      const next = [entry, ...prev].slice(0, MAX_LOG)
      saveLog(next)
      return next
    })
  }, [])

  const clearLog = useCallback(() => {
    setLog([])
    saveLog([])
  }, [])

  useEffect(() => {
    if (!active || !apiKey) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      setNextRunAt(null)
      return
    }

    let cancelled = false

    const runOnce = async () => {
      const cfg = configRef.current
      const direction = pickDirection()
      const asset = randomAsset()

      try {
        const result = await openTrade(apiKey, {
          symbol: asset.symbol,
          direction,
          amount: cfg.amount,
          closeType: "01:00",
          isDemo: cfg.isDemo,
        })

        if (cancelled) return

        pushEntry({
          id: crypto.randomUUID(),
          time: Date.now(),
          symbol: asset.symbol,
          direction,
          amount: cfg.amount,
          isDemo: cfg.isDemo,
          status: result.ok ? "ok" : "error",
          message: result.ok ? "Operação enviada" : `Recusada pela corretora (HTTP ${result.status})`,
        })
      } catch {
        if (cancelled) return
        pushEntry({
          id: crypto.randomUUID(),
          time: Date.now(),
          symbol: asset.symbol,
          direction,
          amount: cfg.amount,
          isDemo: cfg.isDemo,
          status: "error",
          message: "Falha de conexão ao enviar a operação",
        })
      } finally {
        if (!cancelled) schedule(intervalFor(configRef.current.opsPerHour))
      }
    }

    const schedule = (delay: number) => {
      if (cancelled) return
      setNextRunAt(Date.now() + delay)
      timerRef.current = setTimeout(runOnce, delay)
    }

    schedule(FIRST_DELAY_MS)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [active, apiKey, pushEntry])

  return { log, nextRunAt, clearLog }
}
