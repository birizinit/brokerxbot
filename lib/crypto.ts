// Criptografia e senhas — SOMENTE no servidor.
// - Chave API: AES-256-GCM (reversível, pois o robô precisa usá-la).
// - Senha: scrypt (hash não reversível).
// - Sessão: token = AES da identidade da conta, em cookie httpOnly.

import { randomBytes, createCipheriv, createDecipheriv, scryptSync, timingSafeEqual } from "node:crypto"

function key(): Buffer {
  const s = process.env.APP_SECRET
  if (!s || s.length < 64) throw new Error("APP_SECRET ausente ou inválido (precisa de 64 hex)")
  return Buffer.from(s.slice(0, 64), "hex")
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`
}

export function decrypt(blob: string): string {
  const [ivh, tagh, dh] = blob.split(":")
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivh, "hex"))
  decipher.setAuthTag(Buffer.from(tagh, "hex"))
  return Buffer.concat([decipher.update(Buffer.from(dh, "hex")), decipher.final()]).toString("utf8")
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pw, salt, 64)
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salth, hashh] = stored.split(":")
  if (!salth || !hashh) return false
  const expected = Buffer.from(hashh, "hex")
  const hash = scryptSync(pw, Buffer.from(salth, "hex"), 64)
  return hash.length === expected.length && timingSafeEqual(hash, expected)
}

export function makeSession(accountId: string): string {
  return encrypt(`acc:${accountId}`)
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null
  try {
    const v = decrypt(token)
    return v.startsWith("acc:") ? v.slice(4) : null
  } catch {
    return null
  }
}
