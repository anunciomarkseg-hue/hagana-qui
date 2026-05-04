'use client'

import { useReducer, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  QUIZ_QUESTIONS,
  calculateScore,
  isDisqualified,
} from '@/lib/quiz-data'
import { trackQuizStart, trackQuizStep, trackQuizComplete, trackDisqualified } from '@/lib/tracking'
import QuizIntro from './QuizIntro'
import QuizGate from './QuizGate'
import QuizQuestion from './QuizQuestion'
import QuizProcessing from './QuizProcessing'
import QuizResult from './QuizResult'
import GlassCard from '@/components/ui/GlassCard'

type Stage =
  | 'intro'
  | 'gate'
  | 'question'
  | 'processing'
  | 'result'
  | 'disqualified'

interface State {
  stage: Stage
  questionIndex: number
  answers: Record<number, string | string[]>
}

type Action =
  | { type: 'START' }
  | { type: 'GATE_PASS' }
  | { type: 'ANSWER'; questionIndex: number; answer: string | string[] }
  | { type: 'BACK' }
  | { type: 'PROCESSING_DONE' }
  | { type: 'DISQUALIFIED' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return { ...state, stage: 'gate' }

    case 'GATE_PASS':
      return { ...state, stage: 'question', questionIndex: 0 }

    case 'ANSWER': {
      const newAnswers = { ...state.answers, [action.questionIndex]: action.answer }
      const disq = isDisqualified(newAnswers)
      if (disq) return { ...state, answers: newAnswers, stage: 'disqualified' }

      const nextIndex = action.questionIndex + 1
      if (nextIndex >= QUIZ_QUESTIONS.length) {
        return { ...state, answers: newAnswers, stage: 'processing' }
      }
      return { ...state, answers: newAnswers, questionIndex: nextIndex }
    }

    case 'BACK': {
      if (state.questionIndex === 0) return { ...state, stage: 'gate' }
      return { ...state, questionIndex: state.questionIndex - 1 }
    }

    case 'PROCESSING_DONE':
      return { ...state, stage: 'result' }

    default:
      return state
  }
}

const initial: State = {
  stage: 'intro',
  questionIndex: 0,
  answers: {},
}

export default function QuizContainer() {
  const [state, dispatch] = useReducer(reducer, initial)

  const handleStart = useCallback(() => {
    trackQuizStart()
    dispatch({ type: 'START' })
  }, [])

  const handleGatePass = useCallback(() => {
    dispatch({ type: 'GATE_PASS' })
  }, [])

  const handleAnswer = useCallback((answer: string | string[]) => {
    trackQuizStep(state.questionIndex + 1, QUIZ_QUESTIONS.length)
    dispatch({ type: 'ANSWER', questionIndex: state.questionIndex, answer })
  }, [state.questionIndex])

  const handleBack = useCallback(() => {
    dispatch({ type: 'BACK' })
  }, [])

  const handleProcessingDone = useCallback(() => {
    const score = calculateScore(state.answers)
    trackQuizComplete(score, score >= 120 ? 'hot' : score >= 80 ? 'warm' : 'cold')
    dispatch({ type: 'PROCESSING_DONE' })
  }, [state.answers])

  const score = calculateScore(state.answers)

  return (
    <main className="relative min-h-dvh flex items-center justify-center p-4 sm:p-6 bg-hagana-dark overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" aria-hidden />
      <div className="bg-orb bg-orb-2" aria-hidden />
      <div className="bg-orb bg-orb-3" aria-hidden />

      {/* Card */}
      <GlassCard
        strong
        className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl"
      >
        <AnimatePresence mode="wait">
          {state.stage === 'intro' && (
            <QuizIntro key="intro" onStart={handleStart} />
          )}

          {state.stage === 'gate' && (
            <QuizGate key="gate" onContinue={handleGatePass} />
          )}

          {state.stage === 'question' && (
            <QuizQuestion
              key={`q-${state.questionIndex}`}
              question={QUIZ_QUESTIONS[state.questionIndex]}
              questionIndex={state.questionIndex}
              onAnswer={handleAnswer}
              onBack={handleBack}
              canGoBack={true}
            />
          )}

          {state.stage === 'processing' && (
            <QuizProcessing key="processing" onComplete={handleProcessingDone} />
          )}

          {state.stage === 'result' && (
            <QuizResult key="result" answers={state.answers} score={score} />
          )}

          {state.stage === 'disqualified' && (
            <DisqualifiedScreen key="disqualified" />
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Footer */}
      {state.stage === 'intro' || state.stage === 'gate' ? null : (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
          <img src="/logo.png" alt="Haganá" className="h-6 opacity-30 object-contain" />
        </div>
      )}
    </main>
  )
}

function DisqualifiedScreen() {
  return (
    <motion.div
      key="disq"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center gap-6 py-4"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        📍
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Fora da nossa área de atendimento</h2>
        <p className="text-[rgba(240,244,241,0.55)] text-sm leading-relaxed max-w-xs mx-auto">
          No momento atendemos apenas Curitiba e Região Metropolitana. Se precisar, entre em contato pelo site.
        </p>
      </div>

      <a
        href="https://www.hagana.com.br/fale-conosco-hagana-sac/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary flex items-center gap-2 px-6 py-3 rounded-xl text-sm text-[rgba(240,244,241,0.7)] font-medium"
      >
        Falar com a Haganá
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </motion.div>
  )
}
