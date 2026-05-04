declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function trackQuizStart() {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'ViewContent', { content_name: 'quiz_start' })
  window.gtag?.('event', 'quiz_start', { event_category: 'quiz' })
  window.dataLayer?.push({ event: 'quiz_start' })
}

export function trackQuizStep(step: number, total: number) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'CustomEvent', { content_name: `quiz_step_${step}` })
  window.gtag?.('event', 'quiz_step', { event_category: 'quiz', step, total })
  window.dataLayer?.push({ event: 'quiz_step', step })
}

export function trackQuizComplete(score: number, label: string) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'CompleteRegistration', { content_name: 'quiz_complete', value: score })
  window.gtag?.('event', 'quiz_complete', { event_category: 'quiz', score, label })
  window.dataLayer?.push({ event: 'quiz_complete', score, label })
}

export function trackLeadSubmit() {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'Lead')
  window.gtag?.('event', 'conversion', { send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL' })
  window.dataLayer?.push({ event: 'lead_submit' })
}

export function trackConversion() {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'Lead')
  window.gtag?.('event', 'conversion', { send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL' })
  window.dataLayer?.push({ event: 'conversion_obrigado' })
}

export function trackDisqualified(reason: string) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'CustomEvent', { content_name: `disqualified_${reason}` })
  window.gtag?.('event', 'disqualified', { event_category: 'quiz', reason })
  window.dataLayer?.push({ event: 'disqualified', reason })
}
