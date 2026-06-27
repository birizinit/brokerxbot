import { NextResponse, type NextRequest } from "next/server"
import { createAccount } from "@/lib/db"
import { encrypt, hashPassword, makeSession } from "@/lib/crypto"
import { forwardToBroker } from "@/lib/broker"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sessionCookie(res: NextResponse, token: string) {
  res.cookies.set("bx_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!process.env.DATABASE_URL || !process.env.APP_SECRET) {
    return NextResponse.json({ ok: false, error: "servidor não configurado" }, { status: 503 })
  }

  let body: { name?: unknown; email?: unknown; phone?: unknown; password?: unknown; apiKey?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "requisição inválida" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : ""
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : null
  const password = typeof body.password === "string" ? body.password : ""
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : ""

  if (name.length < 2) return NextResponse.json({ ok: false, error: "Informe seu nome." }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "E-mail inválido." }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ ok: false, error: "A senha precisa de ao menos 6 caracteres." }, { status: 400 })
  if (!apiKey) return NextResponse.json({ ok: false, error: "Informe sua chave API." }, { status: 400 })

  // Valida a chave na corretora (best-effort: só bloqueia se for claramente inválida).
  try {
    const check = await forwardToBroker("/token/wallets", apiKey)
    if (check.status === 401 || check.status === 403) {
      return NextResponse.json({ ok: false, error: "Chave API inválida na corretora." }, { status: 400 })
    }
  } catch {
    /* corretora indisponível: permite o cadastro */
  }

  try {
    const id = await createAccount({
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      apiKeyEnc: encrypt(apiKey),
    })
    const res = NextResponse.json({ ok: true, profile: { name, email, phone: phone ?? "" } })
    sessionCookie(res, makeSession(id))
    return res
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return NextResponse.json({ ok: false, error: "Já existe uma conta com esse e-mail." }, { status: 409 })
    }
    console.error("Falha no registro:", e)
    return NextResponse.json({ ok: false, error: "Falha ao criar a conta." }, { status: 500 })
  }
}
