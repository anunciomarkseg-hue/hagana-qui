'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { QUIZ_QUESTIONS, getLeadLabel, buildAnswerSummary } from '@/lib/quiz-data'
import GlowButton from '@/components/ui/GlowButton'
import GlassCard from '@/components/ui/GlassCard'
import { trackLeadSubmit } from '@/lib/tracking'
import { getStoredUTMs } from '@/lib/utm'
import { FormData } from '@/components/quiz/QuizContainer'

const CALENDAR_URL = process.env.NEXT_PUBLIC_CALENDAR_URL || 'https://calendly.com/erick-bonjorno-hagana'

interface QuizResultProps {
  answers: Record<number, string | string[]>
  score: number
  formData: FormData
}

// Questions to show in the summary (choice-only, non-text)
const SUMMARY_QUESTIONS = [0, 3, 4, 7, 8, 9]

function getAnswerLabel(qIndex: number, answer: string | string[]): string {
  const question = QUIZ_QUESTIONS[qIndex]
  if (!question) return ''
  const ids = Array.isArray(answer) ? answer : [answer]
  return ids.map(id => question.options.find(o => o.id === id)?.label ?? id).join(', ')
}

export default function QuizResult({ answers, score, formData }: QuizResultProps) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true

    const summary = buildAnswerSummary(answers)
    const utm = getStoredUTMs()
    const label = getLeadLabel(score)

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        score,
        label,
        summary,
        utm,
      }),
    })
      .then(() => trackLeadSubmit())
      .catch(console.error)
  }, [])

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
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1A6B2E, #2DB84B)', boxShadow: '0 0 28px rgba(45,184,75,0.5)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl sm:text-3xl font-bold text-white"
        >
          Cadastro concluído!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[rgba(240,244,241,0.55)] text-sm"
        >
          Nossa equipe vai entrar em contato com você, {formData.name}.
        </motion.p>
      </div>

      {/* Resumo das respostas */}
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

      {/* Agendar reunião */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3"
      >
        <p className="text-[rgba(240,244,241,0.7)] text-sm font-medium text-center">
          Quer adiantar? Agende agora mesmo:
        </p>

        <a
          href={CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white text-base"
        >
          Agendar uma reunião agora
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </a>

        <p className="text-[rgba(240,244,241,0.25)] text-xs text-center">
          Ou aguarde — nossa equipe entrará em contato em breve.
        </p>
      </motion.div>
    </motion.div>
  )
}
