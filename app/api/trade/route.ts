import type { NextRequest } from "next/server"
import { forwardToBroker } from "@/lib/broker"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest): Promise<Response> {
  const apiKey = request.headers.get("api-token") ?? ""
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id") ?? ""
  if (!id) {
    return Response.json({ message: "id ausente" }, { status: 400 })
  }
  return forwardToBroker(`/token/trades/${encodeURIComponent(id)}`, apiKey)
}
