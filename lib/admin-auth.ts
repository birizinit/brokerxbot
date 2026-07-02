// Autenticação do painel administrativo — SOMENTE no servidor.
// Suporta dois tipos de admin:
//  - "env": admin bootstrap definido por ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_SESSION.
//  - "db":  admins criados pelo painel, guardados na tabela `admins`.
// O cookie httpOnly `bx_admin` guarda o token de sessão.

import { cookies } from "next/headers"
import { readAdminSession } from "@/lib/crypto"

export const ADMIN_COOKIE = "bx_admin"

export type AdminIdentity = { kind: "env" } | { kind: "db"; id: string }

/** Identifica o admin da requisição atual, ou null se não autenticado. */
export function currentAdmin(): AdminIdentity | null {
  const token = cookies().get(ADMIN_COOKIE)?.value
  if (!token) return null

  // Compatibilidade: cookie legado guardava o valor literal de ADMIN_SESSION.
  const envSession = process.env.ADMIN_SESSION
  if (envSession && token === envSession) return { kind: "env" }

  // Token criptografado (novo formato) → "env" ou id do admin no banco.
  const parsed = readAdminSession(token)
  if (parsed === "env") return { kind: "env" }
  if (parsed) return { kind: "db", id: parsed }

  return null
}

/** Verdadeiro se a requisição atual pertence a um administrador válido. */
export function isAdmin(): boolean {
  return currentAdmin() !== null
}
