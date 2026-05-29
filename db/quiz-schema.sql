-- ============================================================================
-- Quiz Haganá — Tracking Avançado
-- ============================================================================
-- Rodar no SQL Editor do Supabase do dashboard-marketing.
-- NÃO toca em rd_leads — apenas adiciona 2 tabelas novas com prefixo quiz_.
-- Idempotente: pode rodar várias vezes sem quebrar nada.
-- ============================================================================

-- ─── quiz_events ───────────────────────────────────────────────────────────
-- Eventos do funil step-by-step (1 linha por interação)
CREATE TABLE IF NOT EXISTS quiz_events (
  id            BIGSERIAL PRIMARY KEY,
  session_id    UUID NOT NULL,
  event_type    TEXT NOT NULL,          -- page_view | quiz_start | gate_pass | quiz_step | quiz_complete | disqualified | lead_submit
  step_number   INT,
  question_id   TEXT,
  answer        JSONB,

  -- Atribuição
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  utm_term      TEXT,
  fbclid        TEXT,
  gclid         TEXT,

  -- Match quality (Meta)
  fbp           TEXT,
  fbc           TEXT,

  -- Contexto técnico
  ip            TEXT,
  user_agent    TEXT,
  referer       TEXT,
  device_type   TEXT,

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_events_session   ON quiz_events (session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_events_type      ON quiz_events (event_type);
CREATE INDEX IF NOT EXISTS idx_quiz_events_created   ON quiz_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_events_campaign  ON quiz_events (utm_campaign);

-- ─── quiz_leads ────────────────────────────────────────────────────────────
-- Lead consolidado do quiz (1 linha por submit). JOIN com rd_leads por email.
CREATE TABLE IF NOT EXISTS quiz_leads (
  id            BIGSERIAL PRIMARY KEY,
  session_id    UUID NOT NULL UNIQUE,
  event_id      UUID NOT NULL UNIQUE,   -- mesmo UUID enviado pro Pixel + CAPI

  -- Dados pessoais
  email         TEXT NOT NULL,
  nome          TEXT,
  telefone      TEXT,
  empresa       TEXT,

  -- Qualificação
  score         INT NOT NULL,
  label         TEXT NOT NULL,          -- hot | warm | cold
  answers       JSONB NOT NULL,
  summary       TEXT,

  -- Atribuição
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  utm_term      TEXT,
  fbclid        TEXT,
  gclid         TEXT,

  -- Match quality
  fbp           TEXT,
  fbc           TEXT,
  ip            TEXT,
  user_agent    TEXT,

  -- Status de envio para integrações externas
  capi_status   TEXT,                   -- success | failed | skipped
  capi_error    TEXT,
  rd_status     TEXT,                   -- success | failed | skipped
  rd_error      TEXT,

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_leads_email    ON quiz_leads (email);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_score    ON quiz_leads (score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_label    ON quiz_leads (label);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_campaign ON quiz_leads (utm_campaign);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_created  ON quiz_leads (created_at DESC);

-- ─── RLS ───────────────────────────────────────────────────────────────────
-- Mesmo padrão que rd_leads: leitura pública (anon), escrita só via service key
ALTER TABLE quiz_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_leads  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura publica" ON quiz_events;
DROP POLICY IF EXISTS "insercao service" ON quiz_events;
CREATE POLICY "leitura publica"  ON quiz_events FOR SELECT USING (true);
CREATE POLICY "insercao service" ON quiz_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "leitura publica" ON quiz_leads;
DROP POLICY IF EXISTS "insercao service" ON quiz_leads;
DROP POLICY IF EXISTS "update service" ON quiz_leads;
CREATE POLICY "leitura publica"  ON quiz_leads FOR SELECT USING (true);
CREATE POLICY "insercao service" ON quiz_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "update service"   ON quiz_leads FOR UPDATE USING (true);

-- ─── Views úteis pro dashboard ─────────────────────────────────────────────

-- Funil de conversão por step
CREATE OR REPLACE VIEW v_quiz_funnel AS
SELECT
  event_type,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(*)                   AS total_events,
  DATE_TRUNC('day', created_at) AS dia
FROM quiz_events
GROUP BY event_type, DATE_TRUNC('day', created_at)
ORDER BY dia DESC, unique_sessions DESC;

-- Lead enriquecido com lifecycle do CRM
CREATE OR REPLACE VIEW v_quiz_leads_completo AS
SELECT
  q.id, q.email, q.nome, q.telefone, q.empresa,
  q.score, q.label,
  q.utm_source, q.utm_campaign, q.utm_content,
  q.created_at AS quiz_completado_em,
  q.capi_status, q.rd_status,
  r.lifecycle      AS rd_lifecycle,
  r.oportunidade   AS rd_oportunidade,
  r.convertido_em  AS rd_convertido_em,
  r.origem         AS rd_origem
FROM quiz_leads q
LEFT JOIN rd_leads r ON r.email = q.email
ORDER BY q.created_at DESC;

-- Performance por campanha (CAC parcial — sem custo Meta ainda)
CREATE OR REPLACE VIEW v_quiz_por_campanha AS
SELECT
  q.utm_campaign,
  q.utm_content,
  COUNT(*)                                                    AS leads,
  ROUND(AVG(q.score)::numeric, 1)                            AS score_medio,
  COUNT(*) FILTER (WHERE q.label = 'hot')                    AS hot,
  COUNT(*) FILTER (WHERE q.label = 'warm')                   AS warm,
  COUNT(*) FILTER (WHERE q.label = 'cold')                   AS cold,
  COUNT(r.email) FILTER (WHERE r.oportunidade = true)        AS viraram_oportunidade,
  MIN(q.created_at)                                           AS primeiro_lead,
  MAX(q.created_at)                                           AS ultimo_lead
FROM quiz_leads q
LEFT JOIN rd_leads r ON r.email = q.email
GROUP BY q.utm_campaign, q.utm_content
ORDER BY leads DESC;
