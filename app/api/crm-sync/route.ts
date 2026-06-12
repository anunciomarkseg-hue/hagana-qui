import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendCAPIEvent } from '@/lib/meta-capi'
import { googleAdsConfigured, uploadGoogleQualifiedLead } from '@/lib/google-ads-conversions'

// ─── Sync RD CRM → Meta CAPI + Google Ads (conversões qualificadas) ──────────
// Roda via Vercel Cron (vercel.json) ou chamada manual (?dry=1 para simular).
// Regra de qualificação: o COMERCIAL avançou o deal até "Proposta enviada" /
// "Apresentação" (ou marcou ganho). Esse é o sinal que separa lead real de
// curioso/candidato a vaga — vaga nunca chega a proposta.
//
// Dedup: cada deal enviado vira uma linha em quiz_events com
// event_type='crm_conversion_sent' e question_id=<deal_id> — nunca reenvia.
// Na Meta o event_id também é determinístico (crm_ql_<deal_id>).

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CRM_BASE = 'https://crm.rdstation.com/api/v1'
const QUALIFIED_STAGES = ['proposta enviada', 'apresentacao']
const LOOKBACK_DAYS = 45 // primeira execução faz backfill desse período

interface CrmDeal {
  _id?: string
  id?: string
  name?: string
  win?: boolean | null
  created_at?: string
  updated_at?: string
  amount_total?: number
  deal_stage?: { name?: string }
  deal_custom_fields?: Array<{ custom_field_id?: string; value?: unknown }>
  contacts?: Array<{
    name?: string
    emails?: Array<{ email?: string }>
    phones?: Array<{ phone?: string }>
  }>
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

function isQualified(deal: CrmDeal): boolean {
  if (deal.win === true) return true
  const stage = norm(deal.deal_stage?.name ?? '')
  return QUALIFIED_STAGES.includes(stage)
}

async function fetchAllDeals(token: string): Promise<CrmDeal[]> {
  const all: CrmDeal[] = []
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${CRM_BASE}/deals?limit=200&page=${page}&token=${token}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`RD CRM deals ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const json = (await res.json()) as { deals?: CrmDeal[]; has_more?: boolean }
    const batch = json.deals ?? []
    all.push(...batch)
    if (!json.has_more || batch.length === 0) break
  }
  return all
}

export async function GET(req: NextRequest) {
  // Proteção opcional: se CRM_SYNC_SECRET estiver setado, exige ?secret= igual.
  const secret = process.env.CRM_SYNC_SECRET
  const given = req.nextUrl.searchParams.get('secret')
    ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (secret && given !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1'

  const crmToken = process.env.RD_CRM_TOKEN
  if (!crmToken) return NextResponse.json({ ok: false, error: 'RD_CRM_TOKEN ausente' }, { status: 500 })

  const supabase = getSupabaseAdmin()
  if (!supabase && !dry) {
    // Sem Supabase não há dedup — não envia nada para não duplicar conversões.
    return NextResponse.json({ ok: false, error: 'Supabase ausente — dedup indisponível' }, { status: 500 })
  }

  const deals = await fetchAllDeals(crmToken)

  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const qualified = deals.filter(d => {
    if (!isQualified(d)) return false
    const ref = d.updated_at || d.created_at || ''
    return ref >= cutoff
  })

  // Já enviados (dedup). Leitura via REST direto: o select equivalente do
  // supabase-js retornava [] sem erro neste deploy (count via head=true via 24
  // linhas — inconsistência não explicada), então usamos o caminho comprovado.
  const sent = new Set<string>()
  let dedupReadError: string | null = null
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sbKey = process.env.SUPABASE_SERVICE_KEY
  if (sbUrl && sbKey) {
    try {
      const res = await fetch(
        `${sbUrl}/rest/v1/quiz_events?select=question_id&event_type=eq.crm_conversion_sent&limit=1000`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }, cache: 'no-store' }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`)
      const rows = (await res.json()) as Array<{ question_id?: string }>
      for (const row of rows) if (row.question_id) sent.add(String(row.question_id))
    } catch (err) {
      dedupReadError = String(err).slice(0, 200)
    }
  } else {
    dedupReadError = 'env Supabase ausente'
  }
  // Sem leitura de dedup não dá pra garantir não-duplicação — aborta envio real.
  if (dedupReadError && !dry) {
    return NextResponse.json({ ok: false, error: `dedup read: ${dedupReadError}` }, { status: 500 })
  }

  const results: Array<Record<string, unknown>> = []

  for (const deal of qualified) {
    const dealId = String(deal._id ?? deal.id ?? '')
    if (!dealId || sent.has(dealId)) continue

    const contact = deal.contacts?.[0]
    const email = contact?.emails?.[0]?.email || undefined
    const phone = contact?.phones?.[0]?.phone || undefined
    const fullName = (contact?.name || deal.name || '').trim()
    const [firstName, ...rest] = fullName.split(' ')
    const stageName = deal.deal_stage?.name ?? (deal.win === true ? 'ganho' : '?')

    // Enriquecimento: se o lead veio do quiz, recupera fbp/fbc/gclid salvos.
    let fbp: string | undefined, fbc: string | undefined, gclid: string | undefined
    if (supabase && (email || phone)) {
      const filters: string[] = []
      if (email) filters.push(`email.eq.${email.trim().toLowerCase()}`)
      if (phone) filters.push(`telefone.eq.${phone.replace(/\D/g, '')}`)
      const { data } = await supabase
        .from('quiz_leads')
        .select('fbp,fbc,gclid')
        .or(filters.join(','))
        .limit(1)
      if (data?.[0]) {
        fbp = data[0].fbp ?? undefined
        fbc = data[0].fbc ?? undefined
        gclid = data[0].gclid ?? undefined
      }
    }

    const entry: Record<string, unknown> = { dealId, stage: stageName, dry }

    if (dry) {
      entry.wouldSend = { meta: Boolean(email || phone), google: googleAdsConfigured(), gclid: Boolean(gclid) }
      results.push(entry)
      continue
    }

    // Meta CAPI — QualifiedLead (hasheado no helper)
    try {
      if (email || phone) {
        await sendCAPIEvent({
          eventName: 'QualifiedLead',
          eventId: `crm_ql_${dealId}`,
          actionSource: 'system_generated',
          customData: { currency: 'BRL', value: deal.amount_total ?? 0, content_name: stageName },
          user: {
            email,
            phone,
            firstName: firstName || undefined,
            lastName: rest.join(' ') || undefined,
            fbp,
            fbc,
          },
        })
        entry.meta = 'success'
      } else {
        entry.meta = 'skipped (sem e-mail/telefone)'
      }
    } catch (err) {
      entry.meta = `error: ${String(err).slice(0, 200)}`
    }

    // Google Ads — upload de conversão (gclid ou Enhanced Conversions for Leads)
    try {
      const g = await uploadGoogleQualifiedLead({ gclid, email, phone, value: deal.amount_total ?? 0 })
      entry.google = g.status + (g.detail ? `: ${g.detail}` : '')
    } catch (err) {
      entry.google = `error: ${String(err).slice(0, 200)}`
    }

    // Registra o envio (dedup) — sem PII, só ids e status.
    if (supabase) {
      // session_id é uuid na tabela — o dedup usa question_id (= deal_id do CRM)
      const { error } = await supabase.from('quiz_events').insert({
        session_id: randomUUID(),
        event_type: 'crm_conversion_sent',
        question_id: dealId,
        answer: { stage: stageName, meta: entry.meta, google: entry.google },
      })
      if (error) entry.dedupWarning = `falha ao registrar envio: ${error.message}`
    }

    results.push(entry)
  }

  return NextResponse.json({
    ok: true,
    dry,
    dealsChecked: deals.length,
    qualifiedInWindow: qualified.length,
    alreadySent: qualified.filter(d => sent.has(String(d._id ?? d.id ?? ''))).length,
    dedupKnown: sent.size,
    dedupReadError,
    ...(dry && supabase ? {
      debug: {
        supabaseHost: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'ausente').replace('https://', '').split('.')[0],
        totalEvents: (await supabase.from('quiz_events').select('id', { count: 'exact', head: true })).count,
        sentEvents: (await supabase.from('quiz_events').select('id', { count: 'exact', head: true })
          .eq('event_type', 'crm_conversion_sent')).count,
      },
    } : {}),
    processed: results.length,
    googleConfigured: googleAdsConfigured(),
    results,
  })
}
