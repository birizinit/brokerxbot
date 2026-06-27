import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(): Promise<Response> {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("bx_session", "", { httpOnly: true, path: "/", maxAge: 0 })
  return res
}
