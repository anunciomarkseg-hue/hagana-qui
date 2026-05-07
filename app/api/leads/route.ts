import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

interface UTMData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
}

interface LeadPayload {
  name: string
  email: string
  phone: string
  company?: string
  score: number
  label: string
  summary: string
  utm?: UTMData
}

// SHA-256 hash exigido pela Meta CAPI
function hash(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(phone: string): string {
  // Remove tudo que não é dígito e garante código do país
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

// ─── RD Station ───────────────────────────────────────────────────────────────
async function sendToRDStation(data: LeadPayload) {
  const token = process.env.RD_TOKEN
  if (!token) {
    console.warn('[RD Station] RD_TOKEN not configured — skipping')
    return
  }

  const body = {
    event_type: 'CONVERSION',
    event_family: 'CDP',
    payload: {
      conversion_identifier: 'quiz-hagana',
      name: data.name,
      email: data.email,
      mobile_phone: data.phone,
      company_name: data.company ?? '',
      cf_quiz_score: String(data.score),
      cf_quiz_perfil: data.label,
      cf_quiz_respostas: data.summary,
      tags: ['quiz-hagana', `lead-${data.label}`, 'curitiba'],
      ...(data.utm?.source   && { traffic_source:   data.utm.source }),
      ...(data.utm?.medium   && { traffic_medium:   data.utm.medium }),
      ...(data.utm?.campaign && { traffic_campaign: data.utm.campaign }),
      ...(data.utm?.content  && { traffic_content:  data.utm.content }),
      ...(data.utm?.term     && { traffic_value:    data.utm.term }),
    },
  }

  const res = await fetch(`https://api.rd.services/platform/conversions?api_key=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`RD Station error ${res.status}: ${err}`)
  }
}

// ─── Meta Conversions API ─────────────────────────────────────────────────────
async function sendToMetaCAPI(data: LeadPayload) {
  const token   = process.env.META_CAPI_TOKEN
  const pixelId = process.env.META_PIXEL_ID || '724771557389668'

  if (!token) {
    console.warn('[Meta CAPI] META_CAPI_TOKEN not configured — skipping')
    return
  }

  const [firstName, ...rest] = data.name.trim().split(' ')
  const lastName = rest.join(' ') || firstName

  const payload = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          em: [hash(data.email)],
          ph: [hash(normalizePhone(data.phone))],
          fn: [hash(firstName)],
          ln: [hash(lastName)],
        },
        custom_data: {
          value: data.score,
          currency: 'BRL',
          lead_label: data.label,
        },
      },
    ],
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meta CAPI error ${res.status}: ${err}`)
  }

  const result = await res.json()
  console.log('[Meta CAPI] Eventos enviados:', result.events_received)
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const data: LeadPayload = await req.json()

    if (!data.name || !data.email || !data.phone) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Dispara RD Station e Meta CAPI em paralelo
    await Promise.allSettled([
      sendToRDStation(data),
      sendToMetaCAPI(data),
    ])

    console.log('[Lead]', {
      name: data.name,
      email: data.email,
      score: data.score,
      label: data.label,
      ts: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API /leads]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
