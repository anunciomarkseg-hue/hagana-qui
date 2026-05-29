import { getSessionId, getClickIds } from './session'
import { getStoredUTMs, getMetaCookies } from './utm'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// ─── Log interno (Supabase via /api/events) ──────────────────────────────────
// Fire-and-forget. Nunca bloqueia. Se falhar, só silencia.
function logEvent(eventType: string, extra: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const payload = {
    sessionId: getSessionId(),
    eventType,
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

// ─── Tracking público (Pixel + Google + dataLayer + Supabase) ────────────────

export function trackQuizStart() {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'ViewContent', { content_name: 'quiz_start' })
  window.gtag?.('event', 'quiz_start', { event_category: 'quiz' })
  window.dataLayer?.push({ event: 'quiz_start' })
  logEvent('quiz_start')
}

export function trackQuizStep(step: number, total: number, questionId?: string | number, answer?: unknown) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'CustomEvent', { content_name: `quiz_step_${step}` })
  window.gtag?.('event', 'quiz_step', { event_category: 'quiz', step, total })
  window.dataLayer?.push({ event: 'quiz_step', step })
  logEvent('quiz_step', { step, questionId, answer })
}

export function trackQuizComplete(score: number, label: string) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'CompleteRegistration', { content_name: 'quiz_complete', value: score })
  window.gtag?.('event', 'quiz_complete', { event_category: 'quiz', score, label })
  window.dataLayer?.push({ event: 'quiz_complete', score, label })
  logEvent('quiz_complete', { score, label })
}

export function trackLeadSubmit(eventId: string, value: number) {
  if (typeof window === 'undefined') return
  window.fbq?.(
    'track',
    'Lead',
    { value, currency: 'BRL' },
    { eventID: eventId }
  )
  window.gtag?.('event', 'conversion', { send_to: 'AW-11323869943/OZTzCJeWn4YbEPeV0pcq' })
  window.dataLayer?.push({ event: 'lead_submit', value })
  logEvent('lead_submit', { value, eventId })
}

export function trackDisqualified(reason: string) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'CustomEvent', { content_name: `disqualified_${reason}` })
  window.gtag?.('event', 'disqualified', { event_category: 'quiz', reason })
  window.dataLayer?.push({ event: 'disqualified', reason })
  logEvent('disqualified', { reason })
}

export function trackPageView() {
  // PageView do Pixel já dispara automático no layout.tsx
  // Aqui só loga internamente.
  logEvent('page_view')
}

export function trackGatePass() {
  logEvent('gate_pass')
}
