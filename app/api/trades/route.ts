import type { NextRequest } from "next/server"
import { forwardToBroker } from "@/lib/broker"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest): Promise<Response> {
  const apiKey = request.headers.get("api-token") ?? ""
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? "1"
  const pageSize = searchParams.get("pageSize") ?? "10"
  return forwardToBroker(`/token/trades?page=${page}&pageSize=${pageSize}`, apiKey)
}
