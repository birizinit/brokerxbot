"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { openTrade, getTrade } from "@/lib/api"
import { randomAsset } from "@/lib/assets"
import type { BotConfig } from "@/lib/storage"
import type { BotOp, OpStatus } from "@/lib/types"

const OPS_KEY = "bo_bot_ops"
const MAX_OPS = 120
const MIN_INTERVAL_MS = 2000
const FIRST_DELAY_MS = 2500
const SETTLE_BUFFER_MS = 4000
const SETTLE_RETRIES = 4
const SETTLE_RETRY_MS = 5000

function loadOps(): BotOp[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(OPS_KEY)
    return raw ? (JSON.parse(raw) as BotOp[]) : []
  } catch {
    return []
  }
}

function saveOps(ops: BotOp[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(OPS_KEY, JSON.stringify(ops.slice(0, MAX_OPS)))
}

function intervalFor(opsPerHour: number): number {
  return Math.max(MIN_INTERVAL_MS, Math.round(3_600_000 / Math.max(1, opsPerHour)))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function isToday(ts: number): boolean {
  const d = new Date(ts)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function dayPnlOf(ops: BotOp[]): number {
  return ops.reduce((sum, o) => (o.pnl != null && isToday(o.time) ? sum + o.pnl : sum), 0)
}

export interface BotRuntime {
  ops: BotOp[]
  nextRunAt: number | null
  nextStake: number
  galeStep: number
  clearOps: () => void
}

/**
 * Motor do bot. Abre operações no ritmo configurado, liquida cada uma pelo id
 * (resultado real da corretora), aplica Gale/Soros no valor da próxima e para
 * sozinho apenas se um limite de risco (Stop Win/Loss) configurado for atingido.
 */
export function useBot(
  apiKey: string,
  config: BotConfig,
  active: boolean,
  onRiskStop: (reason: string) => void,
): BotRuntime {
  const [ops, setOps] = useState<BotOp[]>([])
  const [nextRunAt, setNextRunAt] = useState<number | null>(null)
  const [nextStake, setNextStake] = useState(config.amount)
  const [galeStep, setGaleStep] = useState(0)

  const configRef = useRef(config)
  const opsRef = useRef<BotOp[]>([])
  const galeStepRef = useRef(0)
  const sorosBankRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settleTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const onRiskStopRef = useRef(onRiskStop)
  const stoppedRef = useRef(false)

  const computeStake = useCallback((): number => {
    const c = configRef.current
    const sorosAdd = c.sorosEnabled ? sorosBankRef.current : 0
    const galeMult = c.galeEnabled ? Math.pow(c.galeMultiplier, galeStepRef.current) : 1
    return Math.max(1, round2((c.amount + sorosAdd) * galeMult))
  }, [])

  useEffect(() => {
    configRef.current = config
    setNextStake(computeStake())
  }, [config, computeStake])

  useEffect(() => {
    onRiskStopRef.current = onRiskStop
  }, [onRiskStop])

  useEffect(() => {
    const loaded = loadOps()
    opsRef.current = loaded
    setOps(loaded)
  }, [])

  const writeOps = useCallback((updater: (prev: BotOp[]) => BotOp[]) => {
    setOps((prev) => {
      const next = updater(prev)
      opsRef.current = next
      saveOps(next)
      return next
    })
  }, [])

  const patchOp = useCallback(
    (id: string, changes: Partial<BotOp>) => {
      writeOps((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)))
    },
    [writeOps],
  )

  const clearOps = useCallback(() => {
    opsRef.current = []
    setOps([])
    saveOps([])
  }, [])

  const checkRisk = useCallback(() => {
    if (stoppedRef.current) return
    const c = configRef.current
    const day = dayPnlOf(opsRef.current)
    if (c.stopWin > 0 && day >= c.stopWin) {
      stoppedRef.current = true
      onRiskStopRef.current(`Stop Win atingido (+$${day.toFixed(2)})`)
    } else if (c.stopLoss > 0 && day <= -c.stopLoss) {
      stoppedRef.current = true
      onRiskStopRef.current(`Stop Loss atingido (-$${Math.abs(day).toFixed(2)})`)
    }
  }, [])

  const settle = useCallback(
    async (localId: string, tradeId: string, attempt = 0) => {
      const r = await getTrade(apiKey, tradeId)

      if (r && r.status !== "COMPLETED" && attempt < SETTLE_RETRIES) {
        const t = setTimeout(() => settle(localId, tradeId, attempt + 1), SETTLE_RETRY_MS)
        settleTimers.current.add(t)
        return
      }

      if (!r) {
        patchOp(localId, { status: "error", message: "Não foi possível obter o resultado" })
        return
      }

      let status: OpStatus = "tie"
      if (r.result === "WON" || r.pnl > 0) status = "won"
      else if (r.result === "LOST" || r.pnl < 0) status = "lost"

      const msg =
        status === "won" ? "Vitória" : status === "lost" ? "Derrota" : "Empate / reembolso"
      patchOp(localId, {
        status,
        pnl: round2(r.pnl),
        balanceAfter: r.balance,
        openPrice: r.openPrice,
        closePrice: r.closePrice,
        message: msg,
      })

      if (status === "lost") {
        // Gale: sobe um degrau (só conta quando habilitado); zera o Soros.
        if (configRef.current.galeEnabled) {
          galeStepRef.current = Math.min(galeStepRef.current + 1, configRef.current.galeMaxSteps)
        }
        sorosBankRef.current = 0
      } else if (status === "won") {
        // Vitória zera o Gale e, no Soros, acumula o lucro para reinvestir.
        galeStepRef.current = 0
        if (configRef.current.sorosEnabled) {
          sorosBankRef.current = round2(sorosBankRef.current + Math.max(0, r.pnl))
        }
      }
      setGaleStep(galeStepRef.current)
      setNextStake(computeStake())
      checkRisk()
    },
    [apiKey, patchOp, computeStake, checkRisk],
  )

  useEffect(() => {
    if (!active || !apiKey) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      setNextRunAt(null)
      return
    }

    stoppedRef.current = false
    let cancelled = false

    const runOnce = async () => {
      const c = configRef.current
      const direction = Math.random() < 0.5 ? ("BUY" as const) : ("SELL" as const)
      const asset = randomAsset()
      const stake = computeStake()
      const localId = crypto.randomUUID()

      writeOps((prev) =>
        [
          {
            id: localId,
            tradeId: null,
            time: Date.now(),
            closeTime: null,
            symbol: asset.symbol,
            direction,
            amount: stake,
            isDemo: c.isDemo,
            status: "pending" as OpStatus,
            pnl: null,
            balanceAfter: null,
            openPrice: null,
            closePrice: null,
            message: "Enviando...",
          },
          ...prev,
        ].slice(0, MAX_OPS),
      )

      try {
        const res = await openTrade(apiKey, {
          symbol: asset.symbol,
          direction,
          amount: stake,
          closeType: "01:00",
          isDemo: c.isDemo,
        })
        if (cancelled) return

        if (res.ok && res.tradeId) {
          patchOp(localId, { tradeId: res.tradeId, closeTime: res.closeTime, message: "Em andamento" })
          const target = res.closeTime ?? Date.now() + 60_000
          const delay = Math.max(SETTLE_BUFFER_MS, target - Date.now() + SETTLE_BUFFER_MS)
          const tradeId = res.tradeId
          const t = setTimeout(() => settle(localId, tradeId), delay)
          settleTimers.current.add(t)
        } else {
          patchOp(localId, { status: "error", message: `Recusada pela corretora (HTTP ${res.status})` })
        }
      } catch {
        if (!cancelled) patchOp(localId, { status: "error", message: "Falha de conexão" })
      } finally {
        if (!cancelled && !stoppedRef.current) schedule(intervalFor(configRef.current.opsPerHour))
      }
    }

    const schedule = (delay: number) => {
      if (cancelled || stoppedRef.current) return
      setNextRunAt(Date.now() + delay)
      timerRef.current = setTimeout(runOnce, delay)
    }

    schedule(FIRST_DELAY_MS)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [active, apiKey, writeOps, patchOp, settle, computeStake])

  // Limpa os temporizadores de liquidação somente ao desmontar.
  useEffect(() => {
    const timers = settleTimers.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  return { ops, nextRunAt, nextStake, galeStep, clearOps }
}
