'use client'

import { motion } from 'framer-motion'
import { QuizOption } from '@/lib/quiz-data'

interface OptionCardProps {
  option: QuizOption
  selected: boolean
  onSelect: (id: string) => void
  index: number
}

export default function OptionCard({ option, selected, onSelect, index }: OptionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
      onClick={() => onSelect(option.id)}
      className={`option-card w-full text-left rounded-2xl p-4 sm:p-5 ${selected ? 'selected' : ''}`}
      type="button"
    >
      <div className="relative z-10 flex items-center gap-3">
        <span className={`font-medium text-sm sm:text-base leading-snug ${
          selected ? 'text-white' : 'text-[rgba(240,244,241,0.85)]'
        }`}>
          {option.label}
        </span>

        <span className={`ml-auto flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
          selected
            ? 'border-[#F5C800] bg-[#F5C800]'
            : 'border-[rgba(45,184,75,0.4)]'
        }`}>
          {selected && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#0B0B0C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </div>
    </motion.button>
  )
}
