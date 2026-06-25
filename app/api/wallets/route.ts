import type { NextRequest } from "next/server"
import { forwardToBroker } from "@/lib/broker"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest): Promise<Response> {
  const apiKey = request.headers.get("api-token") ?? ""
  return forwardToBroker("/token/wallets", apiKey)
}
