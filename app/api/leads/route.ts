import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendToRDCRM } from '@/lib/rd-crm'

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
  answers?: Record<string, unknown>
  utm?: UTMData
  eventId?: string
  eventSourceUrl?: string
  sessionId?: string
  fbp?: string
  fbc?: string
  fbclid?: string
  gclid?: string
}

interface MetaContext {
  ip?: string
  userAgent?: string
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
    return { status: 'skipped' as const }
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
  return { status: 'success' as const }
}

// ─── Meta Conversions API ─────────────────────────────────────────────────────
async function sendToMetaCAPI(data: LeadPayload, ctx: MetaContext) {
  const token   = process.env.META_CAPI_TOKEN
  const pixelId = process.env.META_PIXEL_ID || '724771557389668'

  if (!token) {
    console.warn('[Meta CAPI] META_CAPI_TOKEN not configured — skipping')
    return { status: 'skipped' as const }
  }

  const [firstName, ...rest] = data.name.trim().split(' ')
  const lastName = rest.join(' ') || firstName

  const userData: Record<string, unknown> = {
    em: [hash(data.email)],
    ph: [hash(normalizePhone(data.phone))],
    fn: [hash(firstName)],
    ln: [hash(lastName)],
  }
  if (ctx.ip)          userData.client_ip_address = ctx.ip
  if (ctx.userAgent)   userData.client_user_agent = ctx.userAgent
  if (data.fbp)        userData.fbp = data.fbp
  if (data.fbc)        userData.fbc = data.fbc

  const payload = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        ...(data.eventId        && { event_id: data.eventId }),
        ...(data.eventSourceUrl && { event_source_url: data.eventSourceUrl }),
        user_data: userData,
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
  return { status: 'success' as const }
}

// ─── Supabase: insere lead em quiz_leads ─────────────────────────────────────
async function insertQuizLead(data: LeadPayload, ctx: MetaContext) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  if (!data.sessionId || !data.eventId) {
    console.warn('[Supabase] sessionId ou eventId ausente — pulando insert em quiz_leads')
    return null
  }

  const { data: row, error } = await supabase
    .from('quiz_leads')
    .insert({
      session_id:   data.sessionId,
      event_id:     data.eventId,
      email:        data.email,
      nome:         data.name,
      telefone:     data.phone,
      empresa:      data.company ?? null,
      score:        data.score,
      label:        data.label,
      answers:      data.answers ?? {},
      summary:      data.summary,
      utm_source:   data.utm?.source   ?? null,
      utm_medium:   data.utm?.medium   ?? null,
      utm_campaign: data.utm?.campaign ?? null,
      utm_content:  data.utm?.content  ?? null,
      utm_term:     data.utm?.term     ?? null,
      fbclid:       data.fbclid ?? null,
      gclid:        data.gclid  ?? null,
      fbp:          data.fbp    ?? null,
      fbc:          data.fbc    ?? null,
      ip:           ctx.ip      ?? null,
      user_agent:   ctx.userAgent ?? null,
      capi_status:  'pending',
      rd_status:    'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Supabase] insert quiz_leads failed:', error.message)
    return null
  }
  return row?.id ?? null
}

async function updateQuizLeadStatus(
  leadId: number | null,
  capi: { status: string; error?: string },
  rd:   { status: string; error?: string }
) {
  if (leadId == null) return
  const supabase = getSupabaseAdmin()
  if (!supabase) return
  await supabase.from('quiz_leads').update({
    capi_status: capi.status,
    capi_error:  capi.error ?? null,
    rd_status:   rd.status,
    rd_error:    rd.error  ?? null,
  }).eq('id', leadId)
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const data: LeadPayload = await req.json()

    if (!data.name || !data.email || !data.phone) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
            || req.headers.get('x-real-ip')
            || undefined
    const userAgent = req.headers.get('user-agent') ?? undefined
    const ctx: MetaContext = { ip, userAgent }

    // 1. Insere lead no Supabase ANTES (independente de integrações externas)
    //    Se Supabase falhar, leadId fica null e seguimos sem auditoria — não bloqueia
    const leadId = await insertQuizLead(data, ctx).catch(err => {
      console.error('[Supabase] insertQuizLead exception:', err)
      return null
    })

    // 2. Dispara RD Station, Meta CAPI e RD CRM em paralelo
    const [rdResult, capiResult, crmResult] = await Promise.allSettled([
      sendToRDStation(data),
      sendToMetaCAPI(data, ctx),
      sendToRDCRM(data),
    ])

    if (crmResult.status === 'rejected') {
      console.error('[RD CRM] falhou:', String(crmResult.reason).slice(0, 500))
    }

    // 3. Atualiza status no Supabase pra auditoria (fire-and-forget)
    const rdStatus = rdResult.status === 'fulfilled'
      ? { status: rdResult.value.status }
      : { status: 'failed', error: String(rdResult.reason).slice(0, 500) }

    const capiStatus = capiResult.status === 'fulfilled'
      ? { status: capiResult.value.status }
      : { status: 'failed', error: String(capiResult.reason).slice(0, 500) }

    updateQuizLeadStatus(leadId, capiStatus, rdStatus).catch(() => {})

    console.log('[Lead]', {
      name: data.name,
      email: data.email,
      score: data.score,
      label: data.label,
      leadId,
      rd: rdStatus.status,
      capi: capiStatus.status,
      crm: crmResult.status === 'fulfilled' ? crmResult.value.status : 'failed',
      ts: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API /leads]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
