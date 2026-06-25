import type { NextRequest } from "next/server"
import { forwardToBroker } from "@/lib/broker"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = request.headers.get("api-token") ?? ""
  const body = await request.text()
  // Usa o endpoint assíncrono: ele NÃO exige internalBotId, ao contrário do
  // /token/trades/open (controller), que rejeita com "Not allowed to open
  // trade without internal bot".
  return forwardToBroker("/token/trades/open-async", apiKey, { method: "POST", body })
}
