import { assetBySymbol } from "@/lib/assets"
import type { BotOp } from "@/lib/types"

interface HistoryTableProps {
  ops: BotOp[]
  max?: number
}

function timeOf(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function resultLabel(s: BotOp["status"]): { text: string; kind: string } {
  switch (s) {
    case "won":
      return { text: "Ganhou", kind: "won" }
    case "lost":
      return { text: "Perdeu", kind: "lost" }
    case "tie":
      return { text: "Empate", kind: "tie" }
    case "error":
      return { text: "Erro", kind: "error" }
    default:
      return { text: "Em aberto", kind: "pending" }
  }
}

export function HistoryTable({ ops, max = 40 }: HistoryTableProps) {
  const rows = ops.slice(0, max)

  if (rows.length === 0) {
    return <div className="table-empty">Nenhuma operação registrada ainda.</div>
  }

  return (
    <div className="table-wrap">
      <table className="ttable">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Ativo</th>
            <th>Direção</th>
            <th>Resultado</th>
            <th className="ta-r">Valor</th>
            <th className="ta-r">Lucro</th>
            <th className="ta-r">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const asset = assetBySymbol(o.symbol)
            const r = resultLabel(o.status)
            const isBuy = o.direction === "BUY"
            return (
              <tr key={o.id}>
                <td className="num faint">{timeOf(o.time)}</td>
                <td>
                  <span className="cell-asset">
                    {asset.logo && <img src={asset.logo} alt="" />}
                    <span className="num">{o.symbol.replace("USDT", "")}</span>
                  </span>
                </td>
                <td>
                  <span className={`dir ${isBuy ? "up" : "down"}`}>{isBuy ? "Compra" : "Venda"}</span>
                </td>
                <td>
                  <span className="rtag" data-kind={r.kind}>
                    {r.text}
                  </span>
                </td>
                <td className="ta-r num">${o.amount}</td>
                <td className={`ta-r num ${o.pnl == null ? "faint" : o.pnl >= 0 ? "up" : "down"}`}>
                  {o.pnl == null ? "—" : `${o.pnl >= 0 ? "+" : ""}${o.pnl.toFixed(2)}`}
                </td>
                <td className="ta-r num faint">{o.balanceAfter == null ? "—" : o.balanceAfter.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
