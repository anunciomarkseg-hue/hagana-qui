'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { QUIZ_QUESTIONS, getLeadLabel, buildAnswerSummary } from '@/lib/quiz-data'
import GlowButton from '@/components/ui/GlowButton'
import GlassCard from '@/components/ui/GlassCard'
import { trackLeadSubmit } from '@/lib/tracking'
import { getStoredUTMs } from '@/lib/utm'

interface QuizResultProps {
  answers: Record<number, string | string[]>
  score: number
}


interface FormData {
  name: string
  email: string
  phone: string
  company: string
}

const labelConfig = {
  hot:  { text: 'Alto potencial',  color: '#F5C800', bg: 'rgba(245,200,0,0.12)',  dot: '#F5C800' },
  warm: { text: 'Bom perfil',      color: '#2DB84B', bg: 'rgba(45,184,75,0.12)',  dot: '#2DB84B' },
  cold: { text: 'Em avaliação',    color: '#2DB84B', bg: 'rgba(45,184,75,0.08)',  dot: '#2DB84B' },
}

function getAnswerLabel(qIndex: number, answer: string | string[]): string {
  const question = QUIZ_QUESTIONS[qIndex]
  if (!question) return ''
  const ids = Array.isArray(answer) ? answer : [answer]
  return ids.map(id => question.options.find(o => o.id === id)?.label ?? id).join(', ')
}

const SUMMARY_QUESTIONS = [0, 1, 6, 7]

export default function QuizResult({ answers, score }: QuizResultProps) {
  const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '', company: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const label = getLeadLabel(score)
  const cfg = labelConfig[label]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone) {
      setError('Preencha nome, e-mail e telefone para continuar.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const summary = buildAnswerSummary(answers)
      const utm = getStoredUTMs()
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, score, label, summary, utm }),
      })
      if (!res.ok) throw new Error('Falha no envio')

      trackLeadSubmit()
      setSubmitted(true)
      setTimeout(() => {
        window.location.href = '/obrigado'
      }, 1200)
    } catch {
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8 text-center"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1A6B2E, #2DB84B)', boxShadow: '0 0 28px rgba(45,184,75,0.5)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-white font-semibold text-lg">Enviado com sucesso!</p>
        <p className="text-[rgba(240,244,241,0.5)] text-sm">Redirecionando...</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.dot }} />
          {cfg.text}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl sm:text-3xl font-bold text-white"
        >
          Análise concluída!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[rgba(240,244,241,0.55)] text-sm"
        >
          Nossa equipe vai preparar uma proposta personalizada para você.
        </motion.p>
      </div>

      {/* Answer summary */}
      <GlassCard className="p-4">
        <p className="text-[rgba(240,244,241,0.4)] text-xs uppercase tracking-widest mb-3">Seu perfil</p>
        <div className="flex flex-col gap-2">
          {SUMMARY_QUESTIONS.filter(i => answers[i]).map(i => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#2DB84B] mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-[rgba(240,244,241,0.7)] text-xs leading-relaxed">
                {getAnswerLabel(i, answers[i])}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Lead form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-[rgba(240,244,241,0.7)] text-sm font-medium mb-4 text-center">
          Para onde enviamos a proposta personalizada?
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Seu nome completo *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="form-input w-full px-4 py-3.5 rounded-xl text-sm"
            required
          />
          <input
            type="email"
            placeholder="Seu e-mail *"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="form-input w-full px-4 py-3.5 rounded-xl text-sm"
            required
          />
          <input
            type="tel"
            placeholder="WhatsApp / Telefone *"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="form-input w-full px-4 py-3.5 rounded-xl text-sm"
            required
          />
          <input
            type="text"
            placeholder="Empresa (opcional)"
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            className="form-input w-full px-4 py-3.5 rounded-xl text-sm"
          />

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <GlowButton type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </motion.span>
                Enviando...
              </>
            ) : (
              <>
                Receber proposta personalizada
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </GlowButton>

          <p className="text-[rgba(240,244,241,0.25)] text-xs text-center">
            Seus dados são protegidos. Nenhum spam.
          </p>
        </form>
      </motion.div>
    </motion.div>
  )
}
