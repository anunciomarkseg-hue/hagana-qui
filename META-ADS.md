# Meta Ads — Setup e Operação

Documentação da configuração de tracking + campanha Meta do quiz Haganá.

---

## 1. Setup técnico

### Pixel & CAPI

| Item | Valor |
|---|---|
| Pixel ID | `724771557389668` |
| Conjunto de dados | Haganá - PR |
| Domínio do quiz | `quiz.hagana.com.br` |

### Variáveis de ambiente (Vercel)

Configuradas em **Production + Preview**:

| Nome | Origem |
|---|---|
| `META_CAPI_TOKEN` | Gerenciador de Eventos → Configurações → Conversions API → Generate Access Token |
| `META_PIXEL_ID` | `724771557389668` |
| `RD_TOKEN` | RD Station → Integrações → API |

### Eventos disparados pelo quiz

| Evento | Quando dispara | Onde |
|---|---|---|
| `PageView` | Carregamento de qualquer página | Pixel browser ([app/layout.tsx](app/layout.tsx)) |
| `ViewContent` | Início do quiz | [lib/tracking.ts](lib/tracking.ts) `trackQuizStart()` |
| `CompleteRegistration` | Final do quiz | [lib/tracking.ts](lib/tracking.ts) `trackQuizComplete()` |
| `Lead` | Submit dos dados | Pixel browser + CAPI server ([app/api/leads/route.ts](app/api/leads/route.ts)) |

### Deduplicação Pixel ↔ CAPI

- Front gera `event_id = crypto.randomUUID()` em [components/quiz/QuizResult.tsx](components/quiz/QuizResult.tsx)
- Mesmo UUID vai para o Pixel (`{eventID}`) e para o CAPI (`event_id`)
- Meta consolida em 1 evento único → badge **"Deduplicated"** nos Test Events

### Match Quality (EMQ)

CAPI envia em `user_data`:
- `em` (email hash SHA-256)
- `ph` (telefone hash SHA-256)
- `fn` / `ln` (nome/sobrenome hash SHA-256)
- `fbp` / `fbc` (cookies Meta capturados via [lib/utm.ts](lib/utm.ts) `getMetaCookies()`)
- `client_ip_address` (do header `x-forwarded-for`)
- `client_user_agent` (do header `user-agent`)

Expectativa: EMQ 8-9/10.

---

## 2. Setup da campanha

### Objetivo

**Leads → Local de conversão: Site**

⚠️ NÃO usar:
- "Leads → Formulário instantâneo" (pula o quiz)
- "Vendas" (otimiza por Purchase, não Lead)
- "Tráfego" (otimiza por clique, não conversão)

### Evento de otimização

**Conversão Personalizada: `Lead Quiz Haganá`**

| Campo | Valor |
|---|---|
| Fonte de dados | Haganá - PR |
| Fonte da ação | Site |
| Evento base | Lead |
| Regra | URL `contém` `quiz.hagana.com.br` |
| Categoria | Lead |
| Valor | (em branco — CAPI já envia value=score) |

**Por que custom conversion:** o Pixel é compartilhado com outras landings. Filtrar por URL isola o aprendizado do algoritmo só pros leads do quiz.

### Configuração do conjunto

| Item | Valor |
|---|---|
| Orçamento (ABO) | R$ 70/dia |
| Meta de custo por resultado | Em branco (menor custo) |
| Locais | Curitiba + raio 30km |
| Idade | 30–65 |
| Detalhamento | Vazio ou interesses amplos (Pequenas empresas, Condomínios) |
| Posicionamentos | Vantagem+ |
| Janela de atribuição | 7d clique + 1d visualização |

### Estrutura ABO recomendada

```
Campanha: Leads → Site → Lead Quiz Haganá
├── Conjunto A — R$ 70/dia — Vantagem+ Detailed Targeting (sem interesses)
├── Conjunto B — R$ 70/dia — Interesses (condomínios, segurança patrimonial, empresários)
└── Conjunto C — R$ 50/dia — Retargeting (após acumular tráfego)
```

**ABO → CBO:** migrar pra CBO só depois de ≥50 leads/semana e ≥2 conjuntos performando.

### UTMs no anúncio

URL do site no criativo:
```
https://quiz.hagana.com.br/?utm_source=meta&utm_medium=paid&utm_campaign=NOMEDACAMPANHA
```

UTMs alimentam o RD Station (`traffic_source`, `traffic_medium`, etc.) — ver [components/UTMCapture.tsx](components/UTMCapture.tsx) e [lib/utm.ts](lib/utm.ts).

---

## 3. Validar tracking antes de subir

### Test Events (em tempo real)

1. Gerenciador de Eventos → Pixel → aba **"Eventos de teste"**
2. Expandir "Confirme se os eventos do seu **site** estão configurados corretamente"
3. Colar URL: `https://quiz.hagana.com.br`
4. Clicar **"Abrir site"** → abre aba com `?fbclid=...`
5. Em aba **anônima**, completar o quiz inteiro
6. Voltar no Test Events → conferir:

| Coluna | Esperado |
|---|---|
| Evento | `Lead` |
| Recebido de | **Navegador + Servidor** |
| Status | Processado |
| Badge | **Deduplicated** ✅ |

### Visão geral (histórico 24h)

Pra confirmar que CAPI está disparando em produção real (não só teste):

1. Gerenciador de Eventos → Pixel → aba **"Visão geral"**
2. Filtrar últimas 24h
3. Linha do `Lead` deve mostrar:
   - Integração: **"Várias"**
   - Tooltip: **"Enviado por Navegador e API de Conversões"**

---

## 4. Troubleshooting

### Evento "Lead" acinzentado no dropdown da campanha

**Causa:** Pixel não recebeu volume desse evento nos últimos 7 dias.

**Resolução:** disparar 2-3 leads de teste reais → esperar 5-30 min → reabrir dropdown.

### Custom Conversion acinzentada após criação

**Causa:** ela só conta disparos a partir do momento da criação. Criou depois dos testes = sem histórico próprio.

**Resolução:** completar 1 quiz novo → esperar 2-5 min → F5 na página → reabrir dropdown.

### Aviso "Pixel não recebeu atividade em mais de 7 dias"

**Causa:** Pixel inativo pra esse evento específico.

**Resolução:** mesma coisa — fazer 1-2 disparos reais e esperar.

### Test Events mostra só "Navegador", sem "Servidor"

**Possíveis causas:**
1. `META_CAPI_TOKEN` não configurado na Vercel
2. Deploy do código CAPI não está em produção
3. Test Events não recebe CAPI sem `test_event_code` no payload (comportamento esperado — usar **Visão geral** pra validar CAPI)

### Leads duplicados no Gerenciador

**Causa:** `event_id` não está casando entre Pixel e CAPI.

**Resolução:** confere que o último deploy contém o commit `4246f23` (deduplicação event_id).

### CAPI falhando silenciosamente

`/api/leads` usa `Promise.allSettled` — erros não quebram a request. Pra debugar:
1. Vercel → Deployments → último → **Functions** → `/api/leads` → logs
2. Procurar `[Meta CAPI]` warnings ou errors

---

## 5. Monitoramento pós-lançamento

### Primeiras 48h — NÃO MEXER

- Não pausar conjuntos
- Não trocar criativo
- Não mexer orçamento mais de 20%/dia

Mexer = reset de Learning = dinheiro jogado fora.

### Métricas saudáveis

| Métrica | Saudável | Sinal de problema |
|---|---|---|
| CPM | R$ 20–60 | > R$ 100 |
| CTR | > 1% | < 0,5% |
| Taxa início quiz | > 30% | < 15% |
| Taxa conclusão quiz | > 40% | < 20% |
| CPL | R$ 30–150 | > R$ 300 (48h+) |

### Quando tomar decisão

**Regra:** 50 conversões OU 7 dias. O que vier primeiro.

### Próximos passos após sair de Learning

1. Mata os conjuntos com pior CPL
2. Duplica os bons com orçamento +20%/dia
3. Ativa **Value Optimization** (CAPI já envia `value: score`)
4. Cria Lookalike 1% a partir dos leads convertidos (categoria warm/hot)
5. Migra ABO → CBO

---

## 6. Tracking avançado (Supabase)

O quiz escreve em duas tabelas no mesmo Supabase do projeto `dashboard-marketing`.
Isso permite análises de funil, atribuição multi-touch e cruzamento com o
`rd_leads` (lifecycle/oportunidade do CRM) — tudo num lugar só.

### Tabelas

| Tabela | O que guarda |
|---|---|
| `quiz_events` | 1 linha por interação do user (page_view, quiz_start, gate_pass, quiz_step, quiz_complete, disqualified, lead_submit) |
| `quiz_leads` | 1 linha por lead finalizado, com score, label, answers JSONB, todos UTMs + click IDs + match quality |

Schema completo em [db/quiz-schema.sql](db/quiz-schema.sql). É idempotente
(`CREATE TABLE IF NOT EXISTS`) e **não toca** em `rd_leads`.

### Setup inicial (uma única vez)

1. Abre o **Supabase do dashboard-marketing** → SQL Editor
2. Cola e roda [db/quiz-schema.sql](db/quiz-schema.sql)
3. Confere que aparecem `quiz_events`, `quiz_leads` e as 3 views (`v_quiz_funnel`, `v_quiz_leads_completo`, `v_quiz_por_campanha`)
4. Na Vercel do `hagana-quiz`, adiciona as env vars:
   - `NEXT_PUBLIC_SUPABASE_URL` (mesmo URL do dashboard)
   - `SUPABASE_SERVICE_KEY` (mesma service key do dashboard — pega no `.env.local` lá)

### Como funciona

```
[USER abre o quiz]
       │
       ├─► trackPageView()         → POST /api/events  → quiz_events
       │
[USER inicia / passa do gate]
       │
       ├─► trackQuizStart()        → POST /api/events  → quiz_events
       ├─► trackGatePass()         → POST /api/events  → quiz_events
       │
[USER responde cada pergunta]
       │
       ├─► trackQuizStep()         → POST /api/events  → quiz_events
       │
[USER conclui o quiz]
       │
       ├─► trackQuizComplete()     → POST /api/events  → quiz_events
       │
[USER cai na tela de resultado]
       │
       └─► POST /api/leads
             ├─► insert quiz_leads        (Supabase)
             ├─► sendToRDStation()        (RD popula rd_leads via webhook)
             ├─► sendToMetaCAPI()         (com event_id pro Pixel)
             └─► update quiz_leads        (capi_status / rd_status pra auditoria)
```

**Segurança operacional:**
- Tudo Supabase passa por `Promise.allSettled` ou `.catch(() => {})`
- Falha em Supabase **nunca** quebra o quiz, RD ou CAPI
- Cliente Supabase é **server-side only** (service key nunca exposta no browser)
- Sem env vars: tracking avançado é silenciosamente skipado, quiz funciona normal

### Análises prontas (views do schema)

```sql
-- Funil de conversão diário
SELECT * FROM v_quiz_funnel WHERE dia >= NOW() - INTERVAL '7 days';

-- Cada lead do quiz cruzado com lifecycle do CRM
SELECT * FROM v_quiz_leads_completo LIMIT 50;

-- Performance por campanha (score médio + viraram oportunidade)
SELECT * FROM v_quiz_por_campanha;
```

### Queries úteis pra rodar manualmente

**Onde os leads abandonam:**
```sql
SELECT step_number, COUNT(DISTINCT session_id) AS chegaram
FROM quiz_events
WHERE event_type = 'quiz_step'
GROUP BY step_number ORDER BY step_number;
```

**Score médio por campanha:**
```sql
SELECT utm_campaign, AVG(score) AS score_medio, COUNT(*) AS leads
FROM quiz_leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY utm_campaign ORDER BY score_medio DESC;
```

**Taxa de fechamento por label:**
```sql
SELECT q.label,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE r.oportunidade) AS viraram_oport,
       ROUND(100.0 * COUNT(*) FILTER (WHERE r.oportunidade) / COUNT(*), 1) AS taxa_pct
FROM quiz_leads q
LEFT JOIN rd_leads r ON r.email = q.email
GROUP BY q.label ORDER BY q.label;
```

### Próximas fases

- **Fase 2 (após 2 semanas):** sincronizar lifecycle do RD pro `lead_outcomes`, alimentar Custom Audience na Meta com `closed_won` hasheado, criar Lookalike 1%
- **Fase 3 (após 1 mês):** A/B testing por `session_id`, dashboard de funil no Recharts dentro do `dashboard-marketing`

---

## 7. Histórico de mudanças importantes

| Data | Commit | Mudança |
|---|---|---|
| 2026-05-27 | `4246f23` | Deduplicação event_id + match quality (fbp/fbc/IP/UA) |
| 2026-05-?? | `a98b907` | Integração inicial Meta CAPI |
| 2026-05-?? | `1bb819e` | Pixel Meta `724771557389668` instalado |
| 2026-05-?? | `27c0c33` | Google Ads conversion (`AW-11323869943/OZTzCJeWn4YbEPeV0pcq`) |
