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
}

export default function QuizQuestion({
  question,
  questionIndex,
  onAnswer,
  onBack,
  canGoBack,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string[]>([])

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

  const canProceed = selected.length > 0

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

      {/* Question */}
      <div className="space-y-1">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-xl sm:text-2xl font-bold text-white leading-snug"
        >
          {question.question}
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

      {/* Options */}
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
            onClick={() => canProceed && onAnswer(selected)}
            disabled={!canProceed}
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
