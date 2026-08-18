"use client"

import { useMemo } from "react"
import { BarChart, AreaLine, Donut } from "@/components/admin/AdminCharts"
import { TopUsers } from "@/components/admin/TopUsers"
import { PushCard } from "@/components/admin/PushCard"
import type { AdminStats, ClientRow, DailyPoint, TopUser } from "@/components/admin/types"
import { UserIcon, CpuIcon, ActivityIcon, TrophyIcon, DollarIcon, BoltIcon, ShieldIcon, WalletIcon } from "@/components/icons"

interface OverviewTabProps {
  clients: ClientRow[]
  stats: AdminStats | null
  topUsers: TopUser[]
}

interface FilledPoint {
  date: string
  count: number
  label: string
}

/** Preenche uma série contínua dos últimos `days` dias (dias sem dado = 0). */
function fillSeries(points: DailyPoint[], days: number): FilledPoint[] {
  const map = new Map(points.map((p) => [p.date, p.count]))
  const out: FilledPoint[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    out.push({
      date: key,
      count: map.get(key) ?? 0,
      label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    })
  }
  return out
}

function money(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function OverviewTab({ clients, stats, topUsers }: OverviewTabProps) {
  const signups = useMemo(() => fillSeries(stats?.signupsPerDay ?? [], 30), [stats])
  const opsDaily = useMemo(() => fillSeries(stats?.opsPerDay ?? [], 14), [stats])

  const accounts = stats?.accounts ?? clients.length
  const buyers = stats?.buyers ?? 0
  const pendingBuyers = stats?.pendingBuyers ?? 0
  const volume = stats?.volume ?? 0
  const activeBots = stats?.activeBots ?? 0
  const totalOps = stats?.totalOps ?? 0
  const wins = stats?.wins ?? 0
  const losses = stats?.losses ?? 0
  const pnlSum = stats?.pnlSum ?? 0
  const decided = wins + losses
  const winRate = decided > 0 ? (wins / decided) * 100 : 0

  const signupsToday = signups.length ? signups[signups.length - 1].count : 0
  const conversao = buyers > 0 ? ((buyers - pendingBuyers) / buyers) * 100 : 0
  const ativacao = accounts > 0 ? (activeBots / accounts) * 100 : 0

  // Crescimento acumulado a partir de uma linha de base coerente com o total atual.
  const cumulative = useMemo(() => {
    const windowSum = signups.reduce((s, p) => s + p.count, 0)
    let running = Math.max(0, accounts - windowSum)
    return signups.map((p) => (running += p.count))
  }, [signups, accounts])

  return (
    <div className="a-stack">
      <section className="grid metrics-grid">
        <Metric icon={<ShieldIcon size={16} />} label="Liberados" value={String(buyers)} sub={`${pendingBuyers} sem cadastrar`} />
        <Metric icon={<UserIcon size={16} />} label="Usuários" value={String(accounts)} sub={`${conversao.toFixed(0)}% de conversão`} />
        <Metric icon={<CpuIcon size={16} />} label="IAs ativas" value={String(activeBots)} sub={`${ativacao.toFixed(0)}% das contas`} accent />
        <Metric icon={<ActivityIcon size={16} />} label="Operações" value={String(totalOps)} />
        <Metric icon={<WalletIcon size={16} />} label="Volume operado" value={`$ ${money(volume)}`} />
        <Metric
          icon={<TrophyIcon size={16} />}
          label="Assertividade"
          value={`${winRate.toFixed(1)}%`}
          tone={winRate >= 50 ? "up" : decided > 0 ? "down" : "default"}
        />
        <Metric
          icon={<DollarIcon size={16} />}
          label="Resultado"
          value={`${pnlSum >= 0 ? "+" : "-"}$ ${money(Math.abs(pnlSum))}`}
          tone={pnlSum > 0 ? "up" : pnlSum < 0 ? "down" : "default"}
        />
        <Metric icon={<BoltIcon size={16} />} label="Cadastros hoje" value={String(signupsToday)} />
      </section>

      <section className="a-funnel-grid">
        <div className="card pad">
          <div className="a-chart-head">
            <h3 className="disp-title">Funil</h3>
            <span className="a-chart-sub">Comprou → cadastrou → operando</span>
          </div>
          <Funnel
            steps={[
              { label: "Liberados", value: buyers },
              { label: "Criaram conta", value: buyers - pendingBuyers },
              { label: "IA ligada", value: activeBots },
            ]}
          />
          {pendingBuyers > 0 && (
            <p className="a-note">
              <strong>{pendingBuyers}</strong> {pendingBuyers === 1 ? "pessoa comprou e ainda não criou conta" : "pessoas compraram e ainda não criaram conta"}.
              A lista está na aba Permissões, filtro &quot;Pendentes&quot;.
            </p>
          )}
        </div>

        <PushCard />
      </section>

      <TopUsers users={topUsers} />

      <section className="a-chart-grid">
        <div className="card pad a-chart-card">
          <div className="a-chart-head">
            <h3 className="disp-title">Cadastros por dia</h3>
            <span className="a-chart-sub">Últimos 30 dias</span>
          </div>
          <BarChart points={signups.map((p) => ({ label: p.label, value: p.count, title: `${p.label}: ${p.count} cadastro(s)` }))} />
        </div>

        <div className="card pad a-chart-card">
          <div className="a-chart-head">
            <h3 className="disp-title">Crescimento de usuários</h3>
            <span className="a-chart-sub">Acumulado (30 dias)</span>
          </div>
          <AreaLine values={cumulative} />
        </div>

        <div className="card pad a-chart-card">
          <div className="a-chart-head">
            <h3 className="disp-title">Operações por dia</h3>
            <span className="a-chart-sub">Últimos 14 dias</span>
          </div>
          <BarChart points={opsDaily.map((p) => ({ label: p.label, value: p.count, title: `${p.label}: ${p.count} operação(ões)` }))} color="var(--accent-deep)" />
        </div>

        <div className="card pad a-chart-card">
          <div className="a-chart-head">
            <h3 className="disp-title">Resultado das operações</h3>
            <span className="a-chart-sub">Vitórias x Derrotas</span>
          </div>
          <Donut
            segments={[
              { label: "Vitórias", value: wins, color: "var(--up)" },
              { label: "Derrotas", value: losses, color: "var(--down)" },
            ]}
            centerLabel="assertividade"
            centerValue={`${winRate.toFixed(0)}%`}
          />
        </div>
      </section>
    </div>
  )
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const topo = Math.max(steps[0]?.value ?? 0, 1)
  return (
    <div className="a-funnel">
      {steps.map((s, i) => {
        const pct = (s.value / topo) * 100
        const anterior = i > 0 ? steps[i - 1].value : null
        const queda = anterior && anterior > 0 ? (s.value / anterior) * 100 : null
        return (
          <div key={s.label} className="a-funnel-step">
            <div className="a-funnel-top">
              <span className="a-funnel-lab">{s.label}</span>
              <span className="a-funnel-val num">{s.value}</span>
            </div>
            <div className="a-funnel-track">
              <span className="a-funnel-fill" style={{ width: `${Math.max(2, pct)}%` }} />
            </div>
            {queda !== null && <span className="a-funnel-pct">{queda.toFixed(0)}% da etapa anterior</span>}
          </div>
        )
      })}
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  sub,
  tone = "default",
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: "up" | "down" | "default"
  accent?: boolean
}) {
  return (
    <div className="card metric">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-ic">{icon}</span>
      </div>
      <div className={`metric-value num ${accent ? "accent" : ""} ${tone === "up" ? "up" : tone === "down" ? "down" : ""}`}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}
