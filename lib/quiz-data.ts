export interface QuizOption {
  id: string
  label: string
  disqualify?: boolean
  score?: number
  tag?: string
}

export interface QuizQuestion {
  id: number
  question: string
  subtitle?: string
  type: 'single' | 'multiple' | 'text' | 'contact'
  placeholder?: string
  fieldKey?: 'name' | 'company'
  maxSelections?: number
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 0,
    question: 'Qual tipo de empreendimento precisa de atendimento?',
    type: 'single',
    options: [
      { id: 'condo-res',   label: 'Condomínio Residencial',             score: 20 },
      { id: 'condo-com',   label: 'Condomínio Comercial / Logístico',   score: 20 },
      { id: 'institution', label: 'Escola, Hospital ou Clínica',        score: 20 },
      { id: 'industry',    label: 'Indústria',                          score: 20 },
      { id: 'other',       label: 'Outros',                             score: 10 },
    ],
  },
  {
    id: 1,
    question: 'Qual o nome do seu empreendimento?',
    type: 'text',
    placeholder: 'Nome do empreendimento',
    fieldKey: 'company',
    options: [],
  },
  {
    id: 2,
    question: 'E qual o seu nome?',
    type: 'text',
    placeholder: 'Seu nome completo',
    fieldKey: 'name',
    options: [],
  },
  {
    id: 3,
    question: 'Quais serviços te interessam, {name}?',
    subtitle: 'Pode selecionar mais de um',
    type: 'multiple',
    maxSelections: 4,
    options: [
      { id: 'vigilancia',         label: 'Vigilância Armada / Desarmada',              score: 10 },
      { id: 'portaria-acesso',    label: 'Portaria / Controle de Acesso / Recepção',   score: 10 },
      { id: 'limpeza',            label: 'Limpeza e Conservação',                      score: 10 },
      { id: 'zeladoria',          label: 'Zeladoria',                                  score: 10 },
    ],
  },
  {
    id: 4,
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
    id: 5,
    question: 'Como podemos entrar em contato?',
    subtitle: 'Telefone e e-mail são obrigatórios.',
    type: 'contact',
    options: [],
  },
  {
    id: 6,
    question: 'Onde fica o empreendimento, {name}?',
    subtitle: 'Atendemos Curitiba e Região Metropolitana',
    type: 'single',
    options: [
      { id: 'cwb',         label: 'Curitiba',                         score: 15 },
      { id: 'metro',       label: 'Região Metropolitana de Curitiba', score: 12 },
      { id: 'other-pr',    label: 'Outra cidade do Paraná',  disqualify: true, score: 0 },
      { id: 'other-state', label: 'Outro estado',            disqualify: true, score: 0 },
    ],
  },
  {
    id: 7,
    question: 'Quando você precisa que o serviço seja iniciado?',
    type: 'single',
    options: [
      { id: 'urgent',      label: 'Urgente — preciso em até 30 dias',          score: 30 },
      { id: 'soon',        label: 'Nos próximos 3 meses',                       score: 20 },
      { id: 'researching', label: 'Ainda estou pesquisando, sem data definida', score: 10 },
    ],
  },
  {
    id: 8,
    question: 'Sua atuação na contratação?',
    type: 'single',
    options: [
      { id: 'yes',       label: 'Sou Sindico e responsável pela decisão.',                                     score: 25 },
      { id: 'influence', label: 'Sou Conselheiro, preciso consultar mas tenho grande influência',              score: 18 },
      { id: 'technical', label: 'Sou Gestor de Contratos responsável técnico e preciso de aprovação financeira.', score: 12 },
    ],
  },
  {
    id: 9,
    question: 'Como prefere ser contatado, {name}?',
    type: 'single',
    options: [
      { id: 'call',      label: 'Ligação',                     score: 5 },
      { id: 'whatsapp',  label: 'WhatsApp',                    score: 5 },
      { id: 'video',     label: 'Reunião por videochamada',    score: 10 },
      { id: 'email-pref',label: 'E-mail',                      score: 3 },
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
    if (question.type === 'text' || question.type === 'contact') continue
    const ids = Array.isArray(answer) ? answer : [answer]
    for (const id of ids) {
      const option = question.options.find(o => o.id === id)
      if (option?.score) total += option.score
    }
  }
  return total
}

export function isDisqualified(answers: Record<number, string | string[]>): boolean {
  const locationAnswer = answers[6]
  if (!locationAnswer) return false
  const id = Array.isArray(locationAnswer) ? locationAnswer[0] : locationAnswer
  const option = QUIZ_QUESTIONS[6].options.find(o => o.id === id)
  return option?.disqualify === true
}

export function getLeadLabel(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 100) return 'hot'
  if (score >= 60)  return 'warm'
  return 'cold'
}

export function buildAnswerSummary(answers: Record<number, string | string[]>): string {
  const lines: string[] = []
  for (const [qIdxStr, answer] of Object.entries(answers)) {
    const qIdx = parseInt(qIdxStr)
    const question = QUIZ_QUESTIONS[qIdx]
    if (!question) continue
    if (question.type === 'text' || question.type === 'contact') continue
    const ids = Array.isArray(answer) ? answer : [answer]
    const labels = ids.map(id => question.options.find(o => o.id === id)?.label ?? id)
    const questionText = question.question.replace(/\{name\}/g, '').trim().replace(/,\s*$/, '')
    lines.push(`${questionText}: ${labels.join(', ')}`)
  }
  return lines.join(' | ')
}
