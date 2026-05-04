'use client'

import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'

const WHATSAPP_RH = '5541974004109'
const WHATSAPP_MSG = encodeURIComponent('Olá! Gostaria de agendar uma entrevista na Haganá Segurança.')

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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'linear-gradient(135deg, #1A6B2E, #2DB84B)', boxShadow: '0 0 24px rgba(45,184,75,0.4)' }}
      >
        👋
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Antes de começar...
        </h2>
        <p className="text-[rgba(240,244,241,0.55)] text-sm sm:text-base">
          Esse quiz é exclusivo para quem deseja contratar nossos serviços.
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-[rgba(240,244,241,0.8)] font-semibold text-base sm:text-lg"
      >
        Você está buscando uma vaga de emprego na Haganá?
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <button
          onClick={onContinue}
          className="btn-primary flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white text-sm sm:text-base"
        >
          <span>🏢</span>
          Não, quero contratar
        </button>

        <GlassCard className="flex-1">
          <button
            onClick={handleJobSeeker}
            className="w-full h-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-[rgba(240,244,241,0.75)] text-sm sm:text-base hover:text-white transition-colors"
          >
            <span>💼</span>
            Sim, quero trabalhar aqui
          </button>
        </GlassCard>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[rgba(240,244,241,0.3)] text-xs"
      >
        Candidatos serão direcionados ao WhatsApp de Recursos Humanos
      </motion.p>
    </motion.div>
  )
}
