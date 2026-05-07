'use client'

import { motion } from 'framer-motion'

const WHATSAPP_RH = '5541974004109'
const WHATSAPP_MSG = encodeURIComponent('Olá! Gostaria de me candidatar a uma vaga no Grupo Haganá Paraná.')

interface QuizGateProps {
  onContinue: () => void
}

export default function QuizGate({ onContinue }: QuizGateProps) {
  const handleJobSeeker = () => {
    window.open(`https://wa.me/${WHATSAPP_RH}?text=${WHATSAPP_MSG}`, '_blank')
  }

  return (
    <motion.div
      key="gate"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col items-center text-center gap-6"
    >
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1A6B2E, #2DB84B)', boxShadow: '0 0 24px rgba(45,184,75,0.4)' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Antes de começar...
        </h2>
        <p className="text-[rgba(240,244,241,0.65)] text-sm sm:text-base max-w-xs mx-auto leading-relaxed">
          Qual o motivo do seu contato?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 w-full max-w-sm"
      >
        {/* "Quero trabalhar aqui" — mais destaque */}
        <button
          onClick={handleJobSeeker}
          className="btn-primary w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white text-sm sm:text-base"
        >
          Quero trabalhar aqui
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>

        {/* "Quero contratar" — secundário */}
        <button
          onClick={onContinue}
          className="btn-secondary w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-[rgba(240,244,241,0.75)] text-sm sm:text-base hover:text-white transition-colors"
        >
          Quero contratar a Haganá
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs"
        style={{ color: '#F5C800' }}
      >
        Candidatos serão direcionados ao WhatsApp do Recrutamento e seleção
      </motion.p>
    </motion.div>
  )
}
