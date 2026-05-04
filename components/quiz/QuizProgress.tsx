'use client'

import { motion } from 'framer-motion'
import { TOTAL_QUESTIONS } from '@/lib/quiz-data'

interface QuizProgressProps {
  currentStep: number
}

export default function QuizProgress({ currentStep }: QuizProgressProps) {
  const pct = Math.round((currentStep / TOTAL_QUESTIONS) * 100)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[rgba(240,244,241,0.45)] text-xs font-medium">
          Pergunta {currentStep} de {TOTAL_QUESTIONS}
        </span>
        <span className="text-[rgba(245,200,0,0.8)] text-xs font-semibold">
          {pct}%
        </span>
      </div>
      <div className="progress-track h-1.5 w-full">
        <motion.div
          className="progress-fill h-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
