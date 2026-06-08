import { createHash } from 'crypto'

// ─── Meta Conversions API — helper compartilhado ──────────────────────────────
// Usado por /api/leads (evento Lead, com PII) e /api/events (eventos de funil:
// ViewContent, Contact, CompleteRegistration), todos deduplicados com o Pixel
// do browser pelo mesmo event_id.

const GRAPH_VERSION = 'v19.0'
const DEFAULT_PIXEL_ID = '724771557389668'

// SHA-256 exigido pela Meta para os campos de user_data (email, telefone, nome).
export function hashCAPI(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

// Remove não-dígitos e garante o código do país (Brasil).
export function normalizePhoneCAPI(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

export interface CAPIUserInput {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  fbp?: string
  fbc?: string
  ip?: string
  userAgent?: string
}

// Monta o objeto user_data com o máximo de sinais disponíveis (quanto mais
// campos, maior o Event Match Quality).
export function buildUserData(u: CAPIUserInput): Record<string, unknown> {
  const ud: Record<string, unknown> = {}
  if (u.email)     ud.em = [hashCAPI(u.email)]
  if (u.phone)     ud.ph = [hashCAPI(normalizePhoneCAPI(u.phone))]
  if (u.firstName) ud.fn = [hashCAPI(u.firstName)]
  if (u.lastName)  ud.ln = [hashCAPI(u.lastName)]
  if (u.fbp)       ud.fbp = u.fbp
  if (u.fbc)       ud.fbc = u.fbc
  if (u.ip)        ud.client_ip_address = u.ip
  if (u.userAgent) ud.client_user_agent = u.userAgent
  return ud
}

export interface CAPIEvent {
  eventName: string
  eventId?: string
  eventSourceUrl?: string
  actionSource?: string
  customData?: Record<string, unknown>
  user: CAPIUserInput
}

/**
 * Envia um evento para a Meta Conversions API.
 * Retorna { status: 'skipped' } se o token não estiver configurado.
 * Lança em erro de rede/HTTP (chamador decide se trata com allSettled / catch).
 */
export async function sendCAPIEvent(ev: CAPIEvent): Promise<{ status: 'success' | 'skipped' }> {
  const token   = process.env.META_CAPI_TOKEN
  const pixelId = process.env.META_PIXEL_ID || DEFAULT_PIXEL_ID

  if (!token) {
    console.warn('[Meta CAPI] META_CAPI_TOKEN não configurado — pulando', ev.eventName)
    return { status: 'skipped' }
  }

  const payload = {
    data: [
      {
        event_name: ev.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: ev.actionSource || 'website',
        ...(ev.eventId        && { event_id: ev.eventId }),
        ...(ev.eventSourceUrl && { event_source_url: ev.eventSourceUrl }),
        user_data: buildUserData(ev.user),
        ...(ev.customData && { custom_data: ev.customData }),
      },
    ],
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meta CAPI ${res.status}: ${err}`)
  }

  const result = await res.json().catch(() => ({}))
  console.log(`[Meta CAPI] ${ev.eventName} enviado:`, result.events_received ?? '?')
  return { status: 'success' }
}
