'use client'

import { motion } from 'framer-motion'
import GlowButton from '@/components/ui/GlowButton'

interface QuizIntroProps {
  onStart: () => void
}

const benefits = [
  { text: 'Atendimento prioritário' },
  { text: 'Análise personalizada' },
  { text: 'Sem compromisso' },
]

export default function QuizIntro({ onStart }: QuizIntroProps) {
  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center text-center gap-8"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="animate-float"
      >
        <img
          src="/logo.png"
          alt="Grupo Haganá Paraná"
          className="h-16 sm:h-20 w-auto object-contain"
          draggable={false}
        />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
          Descubra a solução{' '}
          <span className="text-glow-yellow" style={{ color: '#F5C800' }}>
            ideal
          </span>{' '}
          para o seu empreendimento
        </h1>
        <p className="text-[rgba(240,244,241,0.6)] text-base sm:text-lg max-w-sm mx-auto leading-relaxed">
          Responda algumas perguntas e receba uma recomendação personalizada de segurança e facilities.
        </p>
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex gap-4 flex-wrap justify-center"
      >
        {benefits.map((b) => (
          <div
            key={b.text}
            className="glass flex items-center gap-2 px-4 py-2 rounded-full"
          >
            <span className="text-[rgba(240,244,241,0.75)] text-xs font-medium">{b.text}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full max-w-xs"
      >
        <GlowButton onClick={onStart} size="lg" fullWidth>
          Iniciar análise
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </GlowButton>

        <p className="text-[rgba(240,244,241,0.3)] text-xs mt-3">
          Grupo Haganá Paraná · Curitiba e Região Metropolitana
        </p>
      </motion.div>
    </motion.div>
  )
}
