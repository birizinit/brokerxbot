import type { NextRequest } from "next/server"
import { listAccounts, deleteAccount, setAccountPassword } from "@/lib/db"
import { hashPassword } from "@/lib/crypto"
import { isAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: "banco não configurado" }, { status: 503 })
  }

  try {
    const clients = await listAccounts()
    return Response.json({ ok: true, clients })
  } catch (error) {
    console.error("Falha ao listar contas:", error)
    return Response.json({ ok: false, error: "falha ao listar" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })

  const id = new URL(request.url).searchParams.get("id") ?? ""
  if (!id) return Response.json({ ok: false, error: "id ausente" }, { status: 400 })

  try {
    await deleteAccount(id)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Falha ao excluir conta:", error)
    return Response.json({ ok: false, error: "falha ao excluir" }, { status: 500 })
  }
}

/** Redefine a senha de um usuário. Body: { id, password }. */
export async function PATCH(request: NextRequest): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!process.env.DATABASE_URL || !process.env.APP_SECRET) {
    return Response.json({ ok: false, error: "servidor não configurado" }, { status: 503 })
  }

  let id = ""
  let password = ""
  try {
    const body = (await request.json()) as { id?: unknown; password?: unknown }
    id = typeof body.id === "string" ? body.id : ""
    password = typeof body.password === "string" ? body.password : ""
  } catch {
    return Response.json({ ok: false, error: "requisição inválida" }, { status: 400 })
  }

  if (!id) return Response.json({ ok: false, error: "id ausente" }, { status: 400 })
  if (password.length < 6) {
    return Response.json({ ok: false, error: "A senha precisa de ao menos 6 caracteres." }, { status: 400 })
  }

  try {
    await setAccountPassword(id, hashPassword(password))
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Falha ao redefinir senha:", error)
    return Response.json({ ok: false, error: "falha ao redefinir senha" }, { status: 500 })
  }
}
