'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { trackConversion } from '@/lib/tracking'

export default function Obrigado() {
  useEffect(() => {
    trackConversion()
  }, [])

  return (
    <main className="relative min-h-dvh flex items-center justify-center p-4 bg-hagana-dark overflow-hidden">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-strong relative z-10 rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center noise"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1A6B2E, #2DB84B)', boxShadow: '0 0 32px rgba(45,184,75,0.5)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Recebemos suas informações!
        </h1>

        <p className="text-[rgba(240,244,241,0.7)] text-base mb-8 leading-relaxed">
          Nossa equipe comercial entrará em contato em breve com uma proposta personalizada para o seu espaço.
        </p>

        <div className="glass rounded-2xl p-4 mb-8">
          <p className="text-[rgba(240,244,241,0.5)] text-xs uppercase tracking-widest mb-1">Haganá Segurança</p>
          <p className="text-[#F5C800] font-semibold text-sm">Curitiba e Região Metropolitana</p>
        </div>

        <a
          href="https://www.hagana.com.br"
          className="btn-secondary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[rgba(240,244,241,0.7)] text-sm font-medium"
        >
          Conheça a Haganá
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </motion.div>
    </main>
  )
}
