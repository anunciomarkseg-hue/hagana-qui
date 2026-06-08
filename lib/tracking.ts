import { getSessionId, getClickIds } from './session'
import { getStoredUTMs, getMetaCookies } from './utm'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '724771557389668'
// Ação de conversão do Google Ads disparada no Lead final.
const GOOGLE_ADS_LEAD_CONVERSION = 'AW-11323869943/OZTzCJeWn4YbEPeV0pcq'

export interface ContactInfo {
  email?: string
  phone?: string
  name?: string
}

// UUID para deduplicar Pixel (browser) ↔ CAPI (servidor) no mesmo evento.
export function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Advanced Matching manual: passa email/telefone/nome (em claro — o fbq faz o
// hash no browser) para subir o Event Match Quality dos eventos do Pixel.
function setAdvancedMatching(c: ContactInfo) {
  if (typeof window === 'undefined' || !window.fbq) return
  if (!c.email && !c.phone) return
  const am: Record<string, string> = {}
  if (c.email) am.em = c.email.trim().toLowerCase()
  if (c.phone) am.ph = c.phone.replace(/\D/g, '')
  if (c.name) {
    const [fn, ...rest] = c.name.trim().split(' ')
    if (fn) am.fn = fn.toLowerCase()
    if (rest.length) am.ln = rest.join(' ').toLowerCase()
  }
  window.fbq('init', PIXEL_ID, am)
}

// ─── Log interno + relay CAPI (Supabase/CAPI via /api/events) ────────────────
// Fire-and-forget. Nunca bloqueia. Se falhar, só silencia.
// `extra.metaEvent` (quando presente) faz o /api/events espelhar o evento na
// Conversions API, deduplicado pelo `extra.eventId`.
interface ServerExtra {
  step?: number
  questionId?: string | number
  answer?: unknown
  metaEvent?: string
  eventId?: string
  value?: number
  currency?: string
  email?: string
  phone?: string
  name?: string
}

function logEvent(eventType: string, extra: ServerExtra = {}) {
  if (typeof window === 'undefined') return
  const payload = {
    sessionId: getSessionId(),
    eventType,
    eventSourceUrl: window.location.href,
    utm: getStoredUTMs(),
    ...getMetaCookies(),
    ...getClickIds(),
    referer: document.referrer || undefined,
    ...extra,
  }
  // keepalive permite que o request termine mesmo se a aba fechar
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => { /* silent */ })
}

// ─── Tracking público (Pixel + Google + dataLayer + Supabase + CAPI) ──────────
// Cada etapa do funil é um evento NOMEADO e distinto.
//   • Standard events (ViewContent/Contact/CompleteRegistration/Lead) → fbq('track')
//   • Micro-passos do quiz                                            → fbq('trackCustom')
// Os marcos que valem otimização também vão por CAPI (dedup via eventID).

// 1) Início do quiz — clicou "Iniciar análise"
export function trackQuizStart() {
  if (typeof window === 'undefined') return
  const eventId = newEventId()
  window.fbq?.('track', 'ViewContent', { content_name: 'quiz_start' }, { eventID: eventId })
  window.gtag?.('event', 'quiz_start', { event_category: 'quiz' })
  window.dataLayer?.push({ event: 'quiz_start' })
  logEvent('quiz_start', { metaEvent: 'ViewContent', eventId })
}

// 2) Passou no gate — escolheu "Quero contratar a Haganá"
export function trackGatePass() {
  if (typeof window === 'undefined') return
  window.fbq?.('trackCustom', 'QuizGatePass')
  window.gtag?.('event', 'quiz_gate_pass', { event_category: 'quiz' })
  window.dataLayer?.push({ event: 'quiz_gate_pass' })
  logEvent('gate_pass') // diagnóstico — sem CAPI
}

// 3) Cada pergunta respondida — evento único "QuizStep" com o número do passo
export function trackQuizStep(step: number, total: number, questionId?: string | number, answer?: unknown) {
  if (typeof window === 'undefined') return
  window.fbq?.('trackCustom', 'QuizStep', { step_number: step, step_total: total, question_id: questionId })
  window.gtag?.('event', 'quiz_step', { event_category: 'quiz', step, total })
  window.dataLayer?.push({ event: 'quiz_step', step })
  logEvent('quiz_step', { step, questionId, answer }) // diagnóstico — sem CAPI
}

// 4) Forneceu contato (telefone + e-mail) na pergunta de contato.
//    Marco de alta intenção e MAIOR volume que o Lead final → ótimo p/ otimizar.
export function trackQuizContact(contact: ContactInfo) {
  if (typeof window === 'undefined') return
  const eventId = newEventId()
  setAdvancedMatching(contact)
  window.fbq?.('track', 'Contact', { content_name: 'quiz_contact' }, { eventID: eventId })
  window.gtag?.('event', 'quiz_contact', { event_category: 'quiz' })
  window.dataLayer?.push({ event: 'quiz_contact' })
  logEvent('quiz_contact', {
    metaEvent: 'Contact',
    eventId,
    email: contact.email,
    phone: contact.phone,
    name: contact.name,
  })
}

// 5) Concluiu todas as perguntas (antes do submit do formulário)
export function trackQuizComplete(score: number, label: string, contact?: ContactInfo) {
  if (typeof window === 'undefined') return
  const eventId = newEventId()
  if (contact) setAdvancedMatching(contact)
  window.fbq?.('track', 'CompleteRegistration', { content_name: 'quiz_complete', value: score, currency: 'BRL' }, { eventID: eventId })
  window.gtag?.('event', 'quiz_complete', { event_category: 'quiz', score, label })
  window.dataLayer?.push({ event: 'quiz_complete', score, label })
  logEvent('quiz_complete', {
    metaEvent: 'CompleteRegistration',
    eventId,
    value: score,
    currency: 'BRL',
    email: contact?.email,
    phone: contact?.phone,
    name: contact?.name,
  })
}

// 6) Lead enviado (formulário submetido). O Lead via CAPI é disparado pelo
//    /api/leads (com PII completa) — aqui NÃO marcamos metaEvent para não
//    duplicar o evento server-side.
export function trackLeadSubmit(eventId: string, value: number, contact?: ContactInfo) {
  if (typeof window === 'undefined') return
  if (contact) setAdvancedMatching(contact)
  window.fbq?.('track', 'Lead', { value, currency: 'BRL' }, { eventID: eventId })
  window.gtag?.('event', 'conversion', { send_to: GOOGLE_ADS_LEAD_CONVERSION, value, currency: 'BRL' })
  window.dataLayer?.push({ event: 'lead_submit', value })
  logEvent('lead_submit', { value, eventId })
}

// Desqualificado (regra de exclusão) — evento nomeado distinto
export function trackDisqualified(reason: string) {
  if (typeof window === 'undefined') return
  window.fbq?.('trackCustom', 'QuizDisqualified', { reason })
  window.gtag?.('event', 'quiz_disqualified', { event_category: 'quiz', reason })
  window.dataLayer?.push({ event: 'quiz_disqualified', reason })
  logEvent('disqualified', { questionId: reason })
}

export function trackPageView() {
  // PageView do Pixel já dispara automático no layout.tsx
  // Aqui só loga internamente.
  logEvent('page_view')
}
