'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  'Analisando suas respostas...',
  'Identificando o perfil ideal...',
  'Mapeando soluções disponíveis...',
  'Preparando recomendação personalizada...',
  'Quase pronto...',
]

interface QuizProcessingProps {
  onComplete: () => void
}

export default function QuizProcessing({ onComplete }: QuizProcessingProps) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(prev => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval)
          setTimeout(onComplete, 600)
          return prev
        }
        return prev + 1
      })
    }, 650)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center gap-10 py-8"
    >
      {/* Animated logo / scanner */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(45,184,75,0.2)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Mid ring */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{ border: '1.5px solid rgba(245,200,0,0.3)' }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        {/* Spinning arc */}
        <motion.div
          className="absolute inset-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="url(#spinGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="72 216"
            />
            <defs>
              <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1A6B2E" stopOpacity="0" />
                <stop offset="50%" stopColor="#2DB84B" stopOpacity="1" />
                <stop offset="100%" stopColor="#F5C800" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Logo in center */}
        <div className="relative z-10 w-16 h-16 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Haganá"
            className="w-14 h-14 object-contain"
            draggable={false}
          />
        </div>

        {/* Scan line */}
        <div className="absolute inset-3 rounded-full overflow-hidden pointer-events-none">
          <div className="scan-line" />
        </div>
      </div>

      {/* Step text */}
      <div className="h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-[rgba(240,244,241,0.7)] text-base font-medium text-center"
          >
            {STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Dot progress */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: i === stepIndex ? 20 : 6,
              height: 6,
              backgroundColor: i <= stepIndex
                ? i === stepIndex ? '#F5C800' : '#2DB84B'
                : 'rgba(255,255,255,0.12)',
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
