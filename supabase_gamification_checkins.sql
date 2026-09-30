-- ==============================================================================
-- SCHEMA SUPABASE: GAMIFICAÇÃO & MONITORAMENTO AO VIVO (CHECK-IN, RADAR & NOTIFICAÇÕES)
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. ADICIONAR COLUNAS is_training_now E last_checkin_at EM profiles E perfis
-- ==============================================================================
DO $$ 
BEGIN 
    -- Tabela public.profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_training_now') THEN
            ALTER TABLE public.profiles ADD COLUMN is_training_now BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_checkin_at') THEN
            ALTER TABLE public.profiles ADD COLUMN last_checkin_at TIMESTAMPTZ;
        END IF;
    END IF;

    -- Tabela public.perfis
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='perfis') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='is_training_now') THEN
            ALTER TABLE public.perfis ADD COLUMN is_training_now BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='last_checkin_at') THEN
            ALTER TABLE public.perfis ADD COLUMN last_checkin_at TIMESTAMPTZ;
        END IF;
    END IF;
END $$;

-- ==============================================================================
-- 3. TABELA: public.checkins (Histórico de Check-ins Diários e Contagem de Streak)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name TEXT,
    tipo TEXT NOT NULL DEFAULT 'treino',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para contagem rápida de streak e histórico
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_created_at_desc ON public.checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON public.checkins(user_id, created_at DESC);

-- ==============================================================================
-- 4. TABELA: public.notificacoes_coach (Feed de Notificações em Tempo Real)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notificacoes_coach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID,
    aluno_nome TEXT NOT NULL DEFAULT 'Aluno Vyra',
    tipo TEXT NOT NULL DEFAULT 'treino_finalizado', -- 'treino_finalizado', 'novo_aluno', 'avaliacao_enviada'
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para filtragem e ordenação rápida
CREATE INDEX IF NOT EXISTS idx_notificacoes_coach_created_at_desc ON public.notificacoes_coach(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_coach_lida ON public.notificacoes_coach(lida);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_coach ENABLE ROW LEVEL SECURITY;

-- Políticas para checkins
DROP POLICY IF EXISTS "checkins_insert_policy" ON public.checkins;
CREATE POLICY "checkins_insert_policy"
    ON public.checkins FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "checkins_select_policy" ON public.checkins;
CREATE POLICY "checkins_select_policy"
    ON public.checkins FOR SELECT
    TO authenticated, anon
    USING (true);

-- Políticas para notificacoes_coach
DROP POLICY IF EXISTS "notificacoes_coach_insert_policy" ON public.notificacoes_coach;
CREATE POLICY "notificacoes_coach_insert_policy"
    ON public.notificacoes_coach FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "notificacoes_coach_select_policy" ON public.notificacoes_coach;
CREATE POLICY "notificacoes_coach_select_policy"
    ON public.notificacoes_coach FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "notificacoes_coach_update_policy" ON public.notificacoes_coach;
CREATE POLICY "notificacoes_coach_update_policy"
    ON public.notificacoes_coach FOR UPDATE
    TO authenticated, anon
    USING (true);

-- ==============================================================================
-- 6. HABILITAR REALTIME (Supabase Publications)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes_coach;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignora se as tabelas já estiverem na publicação
    NULL;
END $$;
