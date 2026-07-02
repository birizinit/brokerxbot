import type { NextRequest } from "next/server"
import { createAdmin, listAdmins, deleteAdmin, getAdminById } from "@/lib/db"
import { hashPassword } from "@/lib/crypto"
import { currentAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function configured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.APP_SECRET)
}

export async function GET(): Promise<Response> {
  if (!currentAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!configured()) return Response.json({ ok: false, error: "servidor não configurado" }, { status: 503 })

  try {
    const admins = await listAdmins()
    return Response.json({ ok: true, admins })
  } catch (error) {
    console.error("Falha ao listar admins:", error)
    return Response.json({ ok: false, error: "falha ao listar" }, { status: 500 })
  }
}

/** Cria um novo acesso de administrador. Body: { name, email, password }. */
export async function POST(request: NextRequest): Promise<Response> {
  if (!currentAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!configured()) return Response.json({ ok: false, error: "servidor não configurado" }, { status: 503 })

  let name = ""
  let email = ""
  let password = ""
  try {
    const body = (await request.json()) as { name?: unknown; email?: unknown; password?: unknown }
    name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : ""
    email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : ""
    password = typeof body.password === "string" ? body.password : ""
  } catch {
    return Response.json({ ok: false, error: "requisição inválida" }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) return Response.json({ ok: false, error: "E-mail inválido." }, { status: 400 })
  if (password.length < 6) {
    return Response.json({ ok: false, error: "A senha precisa de ao menos 6 caracteres." }, { status: 400 })
  }

  try {
    const id = await createAdmin({ name, email, passwordHash: hashPassword(password) })
    return Response.json({ ok: true, admin: { id, name, email } })
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return Response.json({ ok: false, error: "Já existe um admin com esse e-mail." }, { status: 409 })
    }
    console.error("Falha ao criar admin:", e)
    return Response.json({ ok: false, error: "falha ao criar admin" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  const me = currentAdmin()
  if (!me) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!configured()) return Response.json({ ok: false, error: "servidor não configurado" }, { status: 503 })

  const id = new URL(request.url).searchParams.get("id") ?? ""
  if (!id) return Response.json({ ok: false, error: "id ausente" }, { status: 400 })

  // Um admin do banco não pode excluir a si mesmo (evita perder o próprio acesso).
  if (me.kind === "db" && me.id === id) {
    return Response.json({ ok: false, error: "Você não pode excluir o próprio acesso." }, { status: 400 })
  }

  try {
    const target = await getAdminById(id)
    if (!target) return Response.json({ ok: false, error: "admin não encontrado" }, { status: 404 })
    await deleteAdmin(id)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Falha ao excluir admin:", error)
    return Response.json({ ok: false, error: "falha ao excluir" }, { status: 500 })
  }
}
