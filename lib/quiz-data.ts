export interface QuizOption {
  id: string
  label: string
  emoji?: string
  disqualify?: boolean
  score?: number
  tag?: string
}

export interface QuizQuestion {
  id: number
  question: string
  subtitle?: string
  type: 'single' | 'multiple'
  maxSelections?: number
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 0,
    question: 'O que você está buscando para o seu espaço?',
    subtitle: 'Selecione a opção que melhor descreve sua necessidade',
    type: 'single',
    options: [
      { id: 'security',   label: 'Segurança',           emoji: '🛡️', score: 15, tag: 'segurança' },
      { id: 'facilities', label: 'Facilities',           emoji: '🏢', score: 15, tag: 'facilities' },
      { id: 'both',       label: 'Segurança + Facilities integrados', emoji: '⚡', score: 20, tag: 'ambos' },
      { id: 'evaluating', label: 'Ainda estou avaliando as opções',   emoji: '🔍', score: 5,  tag: 'avaliando' },
    ],
  },
  {
    id: 1,
    question: 'Qual tipo de espaço precisa de atendimento?',
    type: 'single',
    options: [
      { id: 'company',     label: 'Empresa ou comércio',           emoji: '🏪', score: 20 },
      { id: 'condo',       label: 'Condomínio residencial',         emoji: '🏘️', score: 20 },
      { id: 'institution', label: 'Escola, hospital ou clínica',    emoji: '🏥', score: 20 },
      { id: 'industry',    label: 'Indústria ou galpão',            emoji: '🏭', score: 20 },
      { id: 'residence',   label: 'Residência',                     emoji: '🏠', score: 10 },
    ],
  },
  {
    id: 2,
    question: 'Quais serviços você tem interesse?',
    subtitle: 'Pode selecionar mais de um',
    type: 'multiple',
    maxSelections: 4,
    options: [
      { id: 'armed-guard',  label: 'Vigilância armada',                score: 10 },
      { id: 'guard',        label: 'Vigilância desarmada / portaria',   score: 10 },
      { id: 'cctv',         label: 'Câmeras CFTV / monitoramento',      score: 10 },
      { id: 'alarm',        label: 'Alarme monitorado',                 score: 10 },
      { id: 'access',       label: 'Controle de acesso',                score: 10 },
      { id: 'cleaning',     label: 'Limpeza e conservação',             score: 10 },
      { id: 'maintenance',  label: 'Manutenção predial',                score: 10 },
      { id: 'reception',    label: 'Recepção / atendimento',            score: 10 },
    ],
  },
  {
    id: 3,
    question: 'Você já possui algum serviço ativo nessa área?',
    type: 'single',
    options: [
      { id: 'improve',  label: 'Sim, mas quero melhorar ou trocar de fornecedor', score: 20 },
      { id: 'expiring', label: 'Sim, mas o contrato está próximo do vencimento',  score: 25 },
      { id: 'first',    label: 'Não — vou contratar pela primeira vez',           score: 15 },
      { id: 'partial',  label: 'Tenho alguns serviços, quero complementar',       score: 18 },
    ],
  },
  {
    id: 4,
    question: 'Qual é a sua maior preocupação hoje?',
    type: 'single',
    options: [
      { id: 'people',       label: 'Segurança das pessoas (colaboradores, clientes, moradores)', score: 15 },
      { id: 'assets',       label: 'Proteção do patrimônio',                                    score: 15 },
      { id: 'access',       label: 'Controle de quem entra e sai',                              score: 15 },
      { id: 'cost-quality', label: 'Custo e qualidade dos serviços prestados',                  score: 10 },
      { id: 'compliance',   label: 'Conformidade com normas e regulamentações',                 score: 10 },
    ],
  },
  {
    id: 5,
    question: 'Onde fica o local que precisa de atendimento?',
    subtitle: 'Atendemos Curitiba e Região Metropolitana',
    type: 'single',
    options: [
      { id: 'cwb-center', label: 'Curitiba — Centro e bairros centrais',    score: 15 },
      { id: 'cwb-zone',   label: 'Curitiba — Demais bairros',               score: 15 },
      { id: 'metro',      label: 'Região Metropolitana de Curitiba',         score: 12 },
      { id: 'other-pr',   label: 'Outra cidade do Paraná',   disqualify: true, score: 0 },
      { id: 'other-state',label: 'Outro estado',             disqualify: true, score: 0 },
    ],
  },
  {
    id: 6,
    question: 'Quando você precisa que o serviço seja iniciado?',
    type: 'single',
    options: [
      { id: 'urgent',     label: 'Urgente — preciso em até 30 dias',          score: 30 },
      { id: 'soon',       label: 'Nos próximos 3 meses',                       score: 20 },
      { id: 'researching',label: 'Ainda estou pesquisando, sem data definida', score: 10 },
    ],
  },
  {
    id: 7,
    question: 'Você é quem decide a contratação?',
    type: 'single',
    options: [
      { id: 'yes',       label: 'Sim, sou o responsável pela decisão',                   score: 25 },
      { id: 'influence', label: 'Preciso consultar, mas tenho grande influência',        score: 18 },
      { id: 'technical', label: 'Sou responsável técnico — preciso de aprovação financeira', score: 12 },
    ],
  },
]

export const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length

export function calculateScore(answers: Record<number, string | string[]>): number {
  let total = 0
  for (const [qIdxStr, answer] of Object.entries(answers)) {
    const qIdx = parseInt(qIdxStr)
    const question = QUIZ_QUESTIONS[qIdx]
    if (!question) continue

    const ids = Array.isArray(answer) ? answer : [answer]
    for (const id of ids) {
      const option = question.options.find(o => o.id === id)
      if (option?.score) total += option.score
    }
  }
  return total
}

export function isDisqualified(answers: Record<number, string | string[]>): boolean {
  const locationAnswer = answers[5]
  if (!locationAnswer) return false
  const id = Array.isArray(locationAnswer) ? locationAnswer[0] : locationAnswer
  const option = QUIZ_QUESTIONS[5].options.find(o => o.id === id)
  return option?.disqualify === true
}

export function getLeadLabel(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 120) return 'hot'
  if (score >= 80)  return 'warm'
  return 'cold'
}

export function buildAnswerSummary(answers: Record<number, string | string[]>): string {
  const lines: string[] = []
  for (const [qIdxStr, answer] of Object.entries(answers)) {
    const qIdx = parseInt(qIdxStr)
    const question = QUIZ_QUESTIONS[qIdx]
    if (!question) continue

    const ids = Array.isArray(answer) ? answer : [answer]
    const labels = ids.map(id => question.options.find(o => o.id === id)?.label ?? id)
    lines.push(`${question.question}: ${labels.join(', ')}`)
  }
  return lines.join(' | ')
}
