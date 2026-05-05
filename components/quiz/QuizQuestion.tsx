'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuizQuestion as QuizQuestionType } from '@/lib/quiz-data'
import OptionCard from '@/components/ui/OptionCard'
import GlowButton from '@/components/ui/GlowButton'
import QuizProgress from '@/components/quiz/QuizProgress'

interface QuizQuestionProps {
  question: QuizQuestionType
  questionIndex: number
  onAnswer: (answer: string | string[]) => void
  onBack: () => void
  canGoBack: boolean
  clientName?: string
  initialValue?: string
  initialContact?: { phone: string; email: string }
}

function resolveQuestion(text: string, name: string): string {
  if (!name) return text.replace(/,?\s*\{name\}/g, '')
  return text.replace(/\{name\}/g, name)
}

export default function QuizQuestion({
  question,
  questionIndex,
  onAnswer,
  onBack,
  canGoBack,
  clientName = '',
  initialValue = '',
  initialContact,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [textValue, setTextValue] = useState(initialValue)
  const [phone, setPhone] = useState(initialContact?.phone ?? '')
  const [email, setEmail] = useState(initialContact?.email ?? '')
  const [touched, setTouched] = useState(false)

  const questionText = resolveQuestion(question.question, clientName)

  // ── Single / Multiple ──────────────────────────────────────────────────────
  const handleSelect = (id: string) => {
    if (question.type === 'single') {
      setSelected([id])
      setTimeout(() => onAnswer(id), 260)
      return
    }
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      const max = question.maxSelections ?? Infinity
      if (prev.length >= max) return prev
      return [...prev, id]
    })
  }

  // ── Text ──────────────────────────────────────────────────────────────────
  const handleTextSubmit = () => {
    if (textValue.trim()) onAnswer(textValue.trim())
  }

  // ── Contact ───────────────────────────────────────────────────────────────
  const contactValid = phone.trim().length >= 8 && email.trim().includes('@')
  const handleContactSubmit = () => {
    if (contactValid) onAnswer(`${phone.trim()}::${email.trim()}`)
  }

  return (
    <motion.div
      key={`q-${question.id}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Progress */}
      <QuizProgress currentStep={questionIndex + 1} />

      {/* Question header */}
      <div className="space-y-1">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-xl sm:text-2xl font-bold text-white leading-snug"
        >
          {questionText}
        </motion.h2>
        {question.subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[rgba(240,244,241,0.45)] text-sm"
          >
            {question.subtitle}
          </motion.p>
        )}
      </div>

      {/* ── Text input ── */}
      {(question.type === 'text') && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3"
        >
          <input
            type="text"
            placeholder={question.placeholder ?? ''}
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
            className="form-input w-full px-4 py-3.5 rounded-xl text-sm"
            autoFocus
            required
          />
          <GlowButton
            onClick={handleTextSubmit}
            disabled={!textValue.trim()}
            size="md"
            fullWidth
          >
            Continuar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </GlowButton>
        </motion.div>
      )}

      {/* ── Contact inputs ── */}
      {question.type === 'contact' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3"
        >
          <input
            type="tel"
            placeholder="Telefone / WhatsApp *"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (document.getElementById('quiz-email') as HTMLInputElement)?.focus()}
            className="form-input w-full px-4 py-3.5 rounded-xl text-sm"
            autoFocus
            required
          />
          <input
            id="quiz-email"
            type="email"
            placeholder="E-mail *"
            value={email}
            onChange={e => { setEmail(e.target.value); setTouched(true) }}
            onKeyDown={e => e.key === 'Enter' && handleContactSubmit()}
            className="form-input w-full px-4 py-3.5 rounded-xl text-sm"
            required
          />
          {touched && !contactValid && (
            <p className="text-red-400 text-xs">Preencha telefone e e-mail válidos para continuar.</p>
          )}
          <GlowButton
            onClick={handleContactSubmit}
            disabled={!contactValid}
            size="md"
            fullWidth
          >
            Continuar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </GlowButton>
        </motion.div>
      )}

      {/* ── Choice options ── */}
      {(question.type === 'single' || question.type === 'multiple') && (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence>
            {question.options.map((option, i) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={selected.includes(option.id)}
                onSelect={handleSelect}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {canGoBack ? (
          <button
            onClick={onBack}
            className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[rgba(240,244,241,0.55)] font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
        ) : (
          <div />
        )}

        {question.type === 'multiple' && (
          <GlowButton
            onClick={() => selected.length > 0 && onAnswer(selected)}
            disabled={selected.length === 0}
            size="md"
          >
            Continuar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </GlowButton>
        )}
      </div>
    </motion.div>
  )
}
