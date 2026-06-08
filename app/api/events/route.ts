import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendCAPIEvent } from '@/lib/meta-capi'

interface UTMData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
}

interface EventPayload {
  sessionId: string
  eventType: string
  step?: number
  questionId?: string | number
  answer?: unknown
  utm?: UTMData
  fbp?: string
  fbc?: string
  fbclid?: string
  gclid?: string
  referer?: string
  // ─ Campos usados só para o relay CAPI (NÃO são persistidos em quiz_events) ─
  metaEvent?: string        // nome do evento Meta a espelhar via CAPI (ex.: Contact)
  eventId?: string          // mesmo id usado no Pixel → deduplicação
  eventSourceUrl?: string
  value?: number
  currency?: string
  email?: string            // PII transitória: usada só para hash de match, não gravada
  phone?: string
  name?: string
  // pode vir mais coisa em `extra` — ignoramos campos desconhecidos
}

/**
 * Log de eventos do funil do quiz.
 * Fire-and-forget: nunca falha o front. Sempre retorna 200.
 */
export async function POST(req: NextRequest) {
  let data: EventPayload
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ ok: true, skipped: 'invalid_json' })
  }

  if (!data?.sessionId || !data?.eventType) {
    return NextResponse.json({ ok: true, skipped: 'missing_fields' })
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
          || req.headers.get('x-real-ip')
          || null
  const userAgent = req.headers.get('user-agent') ?? null

  // ─── Relay para a Meta CAPI (marcos do funil) ──────────────────────────────
  // Fire-and-forget. Independe do Supabase. Só dispara quando o front marca o
  // evento com `metaEvent` (ViewContent, Contact, CompleteRegistration...).
  // Deduplicado com o Pixel do browser pelo mesmo `eventId`.
  if (data.metaEvent && process.env.META_CAPI_TOKEN) {
    const [firstName, ...rest] = (data.name ?? '').trim().split(' ')
    // IMPORTANTE: await — na Vercel (serverless) uma promise não-aguardada é
    // encerrada quando a função responde, então o evento CAPI nunca chegaria.
    try {
      await sendCAPIEvent({
        eventName: data.metaEvent,
        eventId: data.eventId,
        eventSourceUrl: data.eventSourceUrl,
        customData: data.value != null
          ? { value: data.value, currency: data.currency || 'BRL' }
          : undefined,
        user: {
          email: data.email,
          phone: data.phone,
          firstName: firstName || undefined,
          lastName: rest.join(' ') || undefined,
          fbp: data.fbp,
          fbc: data.fbc,
          ip: ip ?? undefined,
          userAgent: userAgent ?? undefined,
        },
      })
    } catch (err) {
      console.error('[api/events] CAPI relay falhou:', String(err).slice(0, 300))
    }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    // Banco não configurado — silencia (não bloqueia front)
    return NextResponse.json({ ok: true, skipped: 'no_supabase' })
  }

  try {
    await supabase.from('quiz_events').insert({
      session_id:    data.sessionId,
      event_type:    data.eventType,
      step_number:   data.step ?? null,
      question_id:   data.questionId != null ? String(data.questionId) : null,
      answer:        data.answer ?? null,
      utm_source:    data.utm?.source   ?? null,
      utm_medium:    data.utm?.medium   ?? null,
      utm_campaign:  data.utm?.campaign ?? null,
      utm_content:   data.utm?.content  ?? null,
      utm_term:      data.utm?.term     ?? null,
      fbclid:        data.fbclid ?? null,
      gclid:         data.gclid  ?? null,
      fbp:           data.fbp    ?? null,
      fbc:           data.fbc    ?? null,
      referer:       data.referer ?? null,
      ip,
      user_agent:    userAgent,
    })
  } catch (err) {
    // Loga mas não estoura — tracking nunca pode quebrar o quiz
    console.error('[api/events] supabase insert failed:', err)
  }

  return NextResponse.json({ ok: true })
}
