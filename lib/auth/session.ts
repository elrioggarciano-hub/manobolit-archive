// Lightweight signed-cookie session for the single shared admin login.
// Uses Web Crypto (available in both the Edge middleware and Node runtimes)
// instead of a full auth library, since there is only one admin account.

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set')
  }
  return secret
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Buffer.from(signature).toString('hex')
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const signature = await hmac(String(expiresAt))
  return `${expiresAt}.${signature}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const [expiresAtRaw, signature] = token.split('.')
  if (!expiresAtRaw || !signature) return false

  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false

  const expectedSignature = await hmac(expiresAtRaw)
  if (expectedSignature.length !== signature.length) return false

  // Constant-time comparison to avoid leaking the signature via timing.
  let mismatch = 0
  for (let i = 0; i < expectedSignature.length; i++) {
    mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return mismatch === 0
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000
