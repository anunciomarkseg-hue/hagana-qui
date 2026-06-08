import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendToRDCRM, updateRDCRMDeal } from '@/lib/rd-crm'
import { sendCAPIEvent } from '@/lib/meta-capi'

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
  // true = lead parcial (contato capturado na Q5, quiz ainda não concluído)
  partial?: boolean
}

interface MetaContext {
  ip?: string
  userAgent?: string
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

// ─── Meta Conversions API (evento Lead, deduplicado com o Pixel via event_id) ──
async function sendToMetaCAPI(data: LeadPayload, ctx: MetaContext) {
  const [firstName, ...rest] = data.name.trim().split(' ')
  const lastName = rest.join(' ') || firstName

  return sendCAPIEvent({
    eventName: 'Lead',
    eventId: data.eventId,
    eventSourceUrl: data.eventSourceUrl,
    customData: { value: data.score, currency: 'BRL', lead_label: data.label },
    user: {
      email: data.email,
      phone: data.phone,
      firstName,
      lastName,
      fbp: data.fbp,
      fbc: data.fbc,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    },
  })
}

interface UpsertResult {
  id: number | null
  rdCrmDealId: string | null
  stage: string | null
}

// ─── Supabase: upsert do lead em quiz_leads (dedup por session_id) ────────────
// Lead parcial (Q5) insere a linha; o submit final atualiza a MESMA linha em vez
// de criar outra. Nunca rebaixa stage de 'complete' para 'partial'.
async function upsertQuizLead(data: LeadPayload, ctx: MetaContext, stage: 'partial' | 'complete'): Promise<UpsertResult | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  if (!data.sessionId || !data.eventId) {
    console.warn('[Supabase] sessionId ou eventId ausente — pulando quiz_leads')
    return null
  }

  const { data: existing } = await supabase
    .from('quiz_leads')
    .select('id, rd_crm_deal_id, stage')
    .eq('session_id', data.sessionId)
    .maybeSingle()

  const fields = {
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
  }

  if (existing) {
    // não rebaixa 'complete' → 'partial'
    const nextStage = existing.stage === 'complete' ? 'complete' : stage
    const { error } = await supabase
      .from('quiz_leads')
      .update({ ...fields, stage: nextStage })
      .eq('id', existing.id)
    if (error) console.error('[Supabase] update quiz_leads failed:', error.message)
    return { id: existing.id, rdCrmDealId: existing.rd_crm_deal_id ?? null, stage: existing.stage ?? null }
  }

  const { data: row, error } = await supabase
    .from('quiz_leads')
    .insert({ session_id: data.sessionId, ...fields, stage, capi_status: 'pending', rd_status: 'pending' })
    .select('id')
    .single()

  if (error) {
    console.error('[Supabase] insert quiz_leads failed:', error.message)
    return null
  }
  return { id: row?.id ?? null, rdCrmDealId: null, stage: null }
}

async function setLeadDealId(leadId: number | null, dealId: string) {
  if (leadId == null) return
  const supabase = getSupabaseAdmin()
  if (!supabase) return
  await supabase.from('quiz_leads').update({ rd_crm_deal_id: dealId }).eq('id', leadId)
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
    const isPartial = data.partial === true

    const crmLead = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      score: data.score,
      label: data.label,
      summary: data.summary,
    }

    // 1. Upsert no Supabase (dedup por session_id). Parcial insere a linha; o
    //    submit final atualiza a MESMA linha. Não bloqueia se o Supabase falhar.
    const lead = await upsertQuizLead(data, ctx, isPartial ? 'partial' : 'complete').catch(err => {
      console.error('[Supabase] upsertQuizLead exception:', err)
      return null
    })
    const leadId = lead?.id ?? null

    // 2. RD CRM — cria a negociação UMA vez (lead parcial da Q5). No final,
    //    ATUALIZA a mesma negociação em vez de criar outra (evita duplicado).
    let dealId = lead?.rdCrmDealId ?? null
    let crmStatus = 'skipped'
    try {
      if (!dealId) {
        const r = await sendToRDCRM(crmLead)
        crmStatus = r.status
        if (r.dealId) { dealId = r.dealId; await setLeadDealId(leadId, r.dealId) }
      } else if (!isPartial) {
        await updateRDCRMDeal(dealId, crmLead)
        crmStatus = 'updated'
      }
    } catch (err) {
      crmStatus = 'failed'
      console.error('[RD CRM] falhou:', String(err).slice(0, 500))
    }

    // 3. Lead parcial para aqui: SEM RD Station (marketing) e SEM CAPI Lead —
    //    esses só no submit final. O evento Contact (Pixel + CAPI) já saiu pelo
    //    /api/events na mesma etapa.
    if (isPartial) {
      console.log('[Lead parcial]', { email: data.email, leadId, crm: crmStatus, ts: new Date().toISOString() })
      return NextResponse.json({ ok: true, partial: true })
    }

    // 4. Submit final: RD Station + Meta CAPI Lead em paralelo
    const [rdResult, capiResult] = await Promise.allSettled([
      sendToRDStation(data),
      sendToMetaCAPI(data, ctx),
    ])

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
      crm: crmStatus,
      ts: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API /leads]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
