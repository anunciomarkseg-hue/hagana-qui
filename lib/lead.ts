import { getStoredUTMs, getMetaCookies } from './utm'
import { getSessionId, getClickIds } from './session'
import { newEventId } from './tracking'

export interface PartialLeadInput {
  name: string
  email: string
  phone: string
  company?: string
  score: number
  label: string
  summary: string
  answers: Record<number, string | string[]>
}

/**
 * Envia o lead PARCIAL assim que o contato (telefone+e-mail) é capturado na Q5,
 * antes de o usuário concluir o quiz. Grava no Supabase e cria a negociação no
 * RD CRM — assim quem abandona depois da Q5 não é perdido. No fim do quiz, o
 * submit final (QuizResult) enriquece a mesma linha/negociação (dedup por
 * session_id + rd_crm_deal_id). Fire-and-forget: nunca bloqueia o quiz.
 */
export function submitPartialLead(input: PartialLeadInput) {
  if (typeof window === 'undefined') return
  const utm = getStoredUTMs()
  const meta = getMetaCookies()
  const clickIds = getClickIds()

  fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      partial: true,
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      score: input.score,
      label: input.label,
      summary: input.summary,
      answers: input.answers,
      utm,
      eventId: newEventId(),
      sessionId: getSessionId(),
      fbp: meta.fbp,
      fbc: meta.fbc,
      fbclid: clickIds.fbclid,
      gclid: clickIds.gclid,
    }),
  }).catch(() => { /* silent — tracking nunca quebra o quiz */ })
}
