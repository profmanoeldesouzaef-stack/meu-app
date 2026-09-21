-- ==============================================================================
-- MIGRAÇÃO SUPABASE: AUDITORIA DE PERSISTÊNCIA COMPLETA
-- Tabelas: perfis, avaliacoes_ciclo, feedbacks_coach
-- Row Level Security (RLS) configurado para Coach, Moderador/Admin e Aluno
-- ==============================================================================

-- 1. Habilita extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA: perfis
-- Armazena dados de Alunos, Coaches e Administradores
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL DEFAULT '',
    cargo TEXT NOT NULL DEFAULT 'aluno' CHECK (cargo IN ('aluno', 'coach', 'admin')),
    role TEXT DEFAULT 'aluno', -- compatibilidade: 'aluno' | 'coach' | 'admin'
    telefone TEXT,
    protocolo_atual TEXT DEFAULT 'Vyra Shape',
    email TEXT,
    avatar_url TEXT,
    peso_kg NUMERIC,
    altura_cm NUMERIC,
    cintura_cm NUMERIC,
    braco_cm NUMERIC,
    torax_cm NUMERIC,
    onboarding_completed BOOLEAN DEFAULT false,
    workout_released BOOLEAN DEFAULT false,
    diet_released BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Assegura que colunas existam mesmo se a tabela já foi criada anteriormente
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='cargo') THEN
        ALTER TABLE public.perfis ADD COLUMN cargo TEXT NOT NULL DEFAULT 'aluno';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='protocolo_atual') THEN
        ALTER TABLE public.perfis ADD COLUMN protocolo_atual TEXT DEFAULT 'Vyra Shape';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='telefone') THEN
        ALTER TABLE public.perfis ADD COLUMN telefone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nome') THEN
        ALTER TABLE public.perfis ADD COLUMN nome TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='role') THEN
        ALTER TABLE public.perfis ADD COLUMN role TEXT DEFAULT 'aluno';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='email') THEN
        ALTER TABLE public.perfis ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='avatar_url') THEN
        ALTER TABLE public.perfis ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='onboarding_completed') THEN
        ALTER TABLE public.perfis ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='workout_released') THEN
        ALTER TABLE public.perfis ADD COLUMN workout_released BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='diet_released') THEN
        ALTER TABLE public.perfis ADD COLUMN diet_released BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ==============================================================================
-- 3. TABELA: avaliacoes_ciclo
-- Medidas de braço, tórax, cintura, peso, observações e URLs das 3 fotos
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes_ciclo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    braco NUMERIC,
    torax NUMERIC,
    cintura NUMERIC,
    peso NUMERIC,
    observacoes TEXT,
    foto_frente_url TEXT,
    foto_lado_url TEXT,
    foto_costas_url TEXT,
    fotos TEXT[],
    coach_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. TABELA: feedbacks_coach
-- Mensagens e apontamentos do coach para o aluno
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.feedbacks_coach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aluno_email TEXT,
    coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    coach_nome TEXT DEFAULT 'Coach Manoel',
    mensagem TEXT NOT NULL,
    apontamentos TEXT,
    tipo TEXT NOT NULL DEFAULT 'geral' CHECK (tipo IN ('geral', 'avaliacao', 'ajuste_treino', 'ajuste_dieta')),
    lido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. FUNÇÃO DE SEGURANÇA: is_coach_or_admin()
-- Permite checar de forma segura se o auth.uid() possui cargo coach ou admin
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_coach_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfis
        WHERE id = auth.uid()
          AND (cargo IN ('coach', 'admin') OR role IN ('coach', 'admin'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. MIGRAÇÃO DE DADOS EXISTENTES (Caso exista a tabela 'profiles')
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        INSERT INTO public.perfis (id, email, nome, cargo, role, avatar_url, updated_at)
        SELECT 
            id, 
            email, 
            COALESCE(full_name, split_part(email, '@', 1)), 
            CASE 
                WHEN role IN ('coach', 'treinador') THEN 'coach'
                WHEN role IN ('admin', 'moderator', 'moderador') THEN 'admin'
                ELSE 'aluno'
            END,
            COALESCE(role, 'aluno'),
            avatar_url,
            COALESCE(updated_at, now())
        FROM public.profiles
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            nome = CASE WHEN public.perfis.nome = '' THEN EXCLUDED.nome ELSE public.perfis.nome END,
            cargo = CASE WHEN public.perfis.cargo = 'aluno' AND EXCLUDED.cargo != 'aluno' THEN EXCLUDED.cargo ELSE public.perfis.cargo END,
            role = EXCLUDED.role;
    END IF;
END $$;

-- ==============================================================================
-- 7. TRIGGER AUTOMÁTICO DE NOVO USUÁRIO (auth.users -> public.perfis)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_perfil()
RETURNS TRIGGER AS $$
DECLARE
    detected_role TEXT;
    user_name TEXT;
BEGIN
    detected_role := COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'cargo', 'aluno');
    IF detected_role NOT IN ('aluno', 'coach', 'admin') THEN
        detected_role := 'aluno';
    END IF;

    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'nome',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.perfis (id, email, nome, cargo, role, protocolo_atual)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        detected_role,
        detected_role,
        'Vyra Shape'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        nome = CASE WHEN public.perfis.nome = '' THEN EXCLUDED.nome ELSE public.perfis.nome END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created_perfil ON auth.users;
CREATE TRIGGER trg_on_auth_user_created_perfil
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_perfil();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ==============================================================================

-- A) Habilitar RLS em todas as tabelas auditadas
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_ciclo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks_coach ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLÍTICAS: public.perfis
-- ------------------------------------------------------------------------------
-- Usuários autenticados podem ler seu próprio perfil; Coach/Admin lê todos
DROP POLICY IF EXISTS "perfis_select_policy" ON public.perfis;
CREATE POLICY "perfis_select_policy"
    ON public.perfis FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_coach_or_admin());

-- Usuários autenticados podem atualizar seu próprio perfil; Coach/Admin atualiza qualquer perfil
DROP POLICY IF EXISTS "perfis_update_policy" ON public.perfis;
CREATE POLICY "perfis_update_policy"
    ON public.perfis FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_coach_or_admin())
    WITH CHECK (auth.uid() = id OR public.is_coach_or_admin());

-- Usuários autenticados podem inserir seu próprio perfil; Coach/Admin pode inserir
DROP POLICY IF EXISTS "perfis_insert_policy" ON public.perfis;
CREATE POLICY "perfis_insert_policy"
    ON public.perfis FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_coach_or_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: public.avaliacoes_ciclo
-- ------------------------------------------------------------------------------
-- Usuários autenticados podem enviar suas próprias avaliações (INSERT with auth.uid() = user_id)
DROP POLICY IF EXISTS "avaliacoes_insert_policy" ON public.avaliacoes_ciclo;
CREATE POLICY "avaliacoes_insert_policy"
    ON public.avaliacoes_ciclo FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Usuários autenticados podem ler suas próprias avaliações; Coach/Admin lê todas
DROP POLICY IF EXISTS "avaliacoes_select_policy" ON public.avaliacoes_ciclo;
CREATE POLICY "avaliacoes_select_policy"
    ON public.avaliacoes_ciclo FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

-- Usuários podem atualizar suas avaliações; Coach/Admin pode atualizar (ex: adicionar coach_feedback)
DROP POLICY IF EXISTS "avaliacoes_update_policy" ON public.avaliacoes_ciclo;
CREATE POLICY "avaliacoes_update_policy"
    ON public.avaliacoes_ciclo FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: public.feedbacks_coach
-- ------------------------------------------------------------------------------
-- Aluno lê os feedbacks enviados para ele (aluno_id = auth.uid()); Coach/Admin lê todos
DROP POLICY IF EXISTS "feedbacks_select_policy" ON public.feedbacks_coach;
CREATE POLICY "feedbacks_select_policy"
    ON public.feedbacks_coach FOR SELECT
    TO authenticated
    USING (aluno_id = auth.uid() OR public.is_coach_or_admin());

-- Perfis com role 'coach' ou 'admin' têm permissão para salvar novos feedbacks
DROP POLICY IF EXISTS "feedbacks_insert_policy" ON public.feedbacks_coach;
CREATE POLICY "feedbacks_insert_policy"
    ON public.feedbacks_coach FOR INSERT
    TO authenticated
    WITH CHECK (public.is_coach_or_admin() OR auth.uid() = coach_id);

-- Coach/Admin pode atualizar feedbacks
DROP POLICY IF EXISTS "feedbacks_update_policy" ON public.feedbacks_coach;
CREATE POLICY "feedbacks_update_policy"
    ON public.feedbacks_coach FOR UPDATE
    TO authenticated
    USING (public.is_coach_or_admin());

-- ------------------------------------------------------------------------------
-- 9. PERMISSÕES PÚBLICAS/ANON PARA AMBIENTE DE DEMONSTRAÇÃO SE NECESSÁRIO
-- Permite leitura anônima caso a sessão esteja temporariamente em modo visitante
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "perfis_anon_select" ON public.perfis;
CREATE POLICY "perfis_anon_select"
    ON public.perfis FOR SELECT
    TO anon
    USING (true);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_perfis_cargo ON public.perfis(cargo);
CREATE INDEX IF NOT EXISTS idx_perfis_email ON public.perfis(email);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_ciclo_user_id ON public.avaliacoes_ciclo(user_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_ciclo_created_at ON public.avaliacoes_ciclo(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_coach_aluno_id ON public.feedbacks_coach(aluno_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_coach_created_at ON public.feedbacks_coach(created_at DESC);
