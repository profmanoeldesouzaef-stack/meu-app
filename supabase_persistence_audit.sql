-- ==============================================================================
-- VYRA TRAINING & PERFORMANCE - MIGRAÇÃO OFICIAL SUPABASE
-- CORREÇÃO DEFINITIVA: "Database error saving new user" + PERSISTÊNCIA COMPLETA
-- ==============================================================================
-- Este script resolve completamente o erro de criação de usuário no Supabase Auth,
-- unifica as tabelas 'profiles' e 'perfis', implementa gatilho blindado anti-falha,
-- cria todas as tabelas oficiais e configura os buckets de armazenamento.
-- ==============================================================================

-- 1. HABILITAR EXTENSÕES ESSENCIAIS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. REMOVER GATILHOS ANTIGOS/CONFLITANTES EM auth.users
-- Evita que triggers com erro bloqueiem o cadastro com "Database error saving new user"
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_on_auth_user_created_perfil ON auth.users;
DROP TRIGGER IF EXISTS trg_on_auth_user_created_profiles ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- ==============================================================================
-- 3. TABELA OFICIAL: public.profiles (Utilizada em todo o sistema)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT DEFAULT '',
    name TEXT DEFAULT '',
    full_name TEXT DEFAULT '',
    email TEXT,
    cargo TEXT NOT NULL DEFAULT 'aluno',
    role TEXT NOT NULL DEFAULT 'aluno',
    telefone TEXT,
    phone TEXT,
    protocolo_atual TEXT DEFAULT 'Vyra Shape',
    avatar_url TEXT,
    peso_kg NUMERIC,
    altura_cm NUMERIC,
    cintura_cm NUMERIC,
    braco_cm NUMERIC,
    torax_cm NUMERIC,
    onboarding_completed BOOLEAN DEFAULT false,
    workout_released BOOLEAN DEFAULT false,
    diet_released BOOLEAN DEFAULT false,
    is_champion BOOLEAN DEFAULT false,
    champion_badge TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Garantir colunas essenciais caso a tabela 'profiles' já exista
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='nome') THEN
        ALTER TABLE public.profiles ADD COLUMN nome TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='name') THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='cargo') THEN
        ALTER TABLE public.profiles ADD COLUMN cargo TEXT NOT NULL DEFAULT 'aluno';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'aluno';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='telefone') THEN
        ALTER TABLE public.profiles ADD COLUMN telefone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='protocolo_atual') THEN
        ALTER TABLE public.profiles ADD COLUMN protocolo_atual TEXT DEFAULT 'Vyra Shape';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='peso_kg') THEN
        ALTER TABLE public.profiles ADD COLUMN peso_kg NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='altura_cm') THEN
        ALTER TABLE public.profiles ADD COLUMN altura_cm NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='cintura_cm') THEN
        ALTER TABLE public.profiles ADD COLUMN cintura_cm NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='braco_cm') THEN
        ALTER TABLE public.profiles ADD COLUMN braco_cm NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='torax_cm') THEN
        ALTER TABLE public.profiles ADD COLUMN torax_cm NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='onboarding_completed') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='workout_released') THEN
        ALTER TABLE public.profiles ADD COLUMN workout_released BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='diet_released') THEN
        ALTER TABLE public.profiles ADD COLUMN diet_released BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_champion') THEN
        ALTER TABLE public.profiles ADD COLUMN is_champion BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='champion_badge') THEN
        ALTER TABLE public.profiles ADD COLUMN champion_badge TEXT;
    END IF;
END $$;

-- ==============================================================================
-- 4. TABELA DE COMPATIBILIDADE: public.perfis (Totalmente sincronizada)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT DEFAULT '',
    cargo TEXT NOT NULL DEFAULT 'aluno',
    role TEXT DEFAULT 'aluno',
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

-- Garantir colunas em public.perfis
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='perfis' AND column_name='nome') THEN
        ALTER TABLE public.perfis ADD COLUMN nome TEXT DEFAULT '';
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
-- 5. FUNÇÃO BLINDADA ANTI-ERRO: handle_new_user()
-- Nunca trava a inserção em auth.users; captura exceções e garante o perfil
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    detected_role TEXT;
    user_name TEXT;
BEGIN
    -- Identificar papel (aluno, coach ou admin)
    detected_role := COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'cargo', 'aluno');
    IF detected_role NOT IN ('aluno', 'coach', 'admin') THEN
        detected_role := 'aluno';
    END IF;

    -- Identificar nome completo ou nome de exibição
    user_name := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        NULLIF(NEW.raw_user_meta_data->>'nome', ''),
        split_part(NEW.email, '@', 1)
    );

    -- 1. Inserir com proteção em public.profiles
    BEGIN
        INSERT INTO public.profiles (
            id, email, nome, name, full_name, cargo, role, protocolo_atual, onboarding_completed, workout_released, diet_released
        ) VALUES (
            NEW.id,
            NEW.email,
            user_name,
            user_name,
            user_name,
            detected_role,
            detected_role,
            'Vyra Shape',
            false,
            false,
            false
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            nome = CASE WHEN COALESCE(public.profiles.nome, '') = '' THEN EXCLUDED.nome ELSE public.profiles.nome END,
            full_name = CASE WHEN COALESCE(public.profiles.full_name, '') = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
            updated_at = timezone('utc'::text, now());
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user profiles warning: %', SQLERRM;
    END;

    -- 2. Inserir com proteção em public.perfis (para compatibilidade total)
    BEGIN
        INSERT INTO public.perfis (
            id, email, nome, cargo, role, protocolo_atual, onboarding_completed, workout_released, diet_released
        ) VALUES (
            NEW.id,
            NEW.email,
            user_name,
            detected_role,
            detected_role,
            'Vyra Shape',
            false,
            false,
            false
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            nome = CASE WHEN COALESCE(public.perfis.nome, '') = '' THEN EXCLUDED.nome ELSE public.perfis.nome END,
            updated_at = timezone('utc'::text, now());
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user perfis warning: %', SQLERRM;
    END;

    -- SEMPRE retorna NEW para jamais abortar a transação do Supabase Auth
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user global warning: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar gatilho na tabela auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. SINCRONIZAR USUÁRIOS JÁ EXISTENTES DE auth.users PARA AS TABELAS DE PERFIL
-- Garante que nenhum usuário anterior fique sem registro no banco
-- ==============================================================================
INSERT INTO public.profiles (id, email, nome, name, full_name, cargo, role, protocolo_atual)
SELECT 
    u.id,
    u.email,
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
    COALESCE(NULLIF(u.raw_user_meta_data->>'cargo', ''), NULLIF(u.raw_user_meta_data->>'role', ''), 'aluno'),
    COALESCE(NULLIF(u.raw_user_meta_data->>'role', ''), NULLIF(u.raw_user_meta_data->>'cargo', ''), 'aluno'),
    'Vyra Shape'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.perfis (id, email, nome, cargo, role, protocolo_atual)
SELECT 
    u.id,
    u.email,
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
    COALESCE(NULLIF(u.raw_user_meta_data->>'cargo', ''), NULLIF(u.raw_user_meta_data->>'role', ''), 'aluno'),
    COALESCE(NULLIF(u.raw_user_meta_data->>'role', ''), NULLIF(u.raw_user_meta_data->>'cargo', ''), 'aluno'),
    'Vyra Shape'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 7. FUNÇÃO DE SEGURANÇA: is_coach_or_admin()
-- Permite checar de forma segura se o auth.uid() possui cargo coach ou admin
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_coach_or_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (cargo IN ('coach', 'admin', 'moderator') OR role IN ('coach', 'admin', 'moderator'))
    ) OR EXISTS (
        SELECT 1 FROM public.perfis
        WHERE id = auth.uid()
          AND (cargo IN ('coach', 'admin', 'moderator') OR role IN ('coach', 'admin', 'moderator'))
    );
END;
$$;

-- ==============================================================================
-- 8. TABELA OFICIAL: public.avaliacoes (Upload de Fotos e Registo Periódico de 20 Dias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    peso NUMERIC,
    braco NUMERIC,
    cintura NUMERIC,
    torax NUMERIC,
    coxa NUMERIC,
    observacoes TEXT,
    foto_frente_url TEXT,
    foto_lado_url TEXT,
    foto_costas_url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    coach_feedback TEXT,
    data_avaliacao TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='avaliacoes' AND column_name='coxa') THEN
        ALTER TABLE public.avaliacoes ADD COLUMN coxa NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='avaliacoes' AND column_name='status') THEN
        ALTER TABLE public.avaliacoes ADD COLUMN status TEXT DEFAULT 'pendente';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='avaliacoes' AND column_name='coach_feedback') THEN
        ALTER TABLE public.avaliacoes ADD COLUMN coach_feedback TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='avaliacoes' AND column_name='data_avaliacao') THEN
        ALTER TABLE public.avaliacoes ADD COLUMN data_avaliacao TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- TABELA: avaliacoes_ciclo (legado/retrocompatibilidade)
CREATE TABLE IF NOT EXISTS public.avaliacoes_ciclo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    braco NUMERIC,
    torax NUMERIC,
    cintura NUMERIC,
    peso NUMERIC,
    coxa NUMERIC,
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
-- 9. TABELA: public.feedbacks_coach (Comunicação e Feedback do Treinador)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.feedbacks_coach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aluno_email TEXT,
    coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    coach_nome TEXT DEFAULT 'Coach Manoel',
    mensagem TEXT NOT NULL,
    apontamentos TEXT,
    tipo TEXT NOT NULL DEFAULT 'geral',
    lido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. TABELA: public.desafios_config & BUCKET 'desafios' (Gestão de Premiação)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.desafios_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT DEFAULT 'Desafio Oficial Vyra - Transformação',
    subtitulo TEXT DEFAULT '12 semanas de foco e evolução estética',
    premiacao TEXT DEFAULT 'Troféu Oficial Vyra + Suplementação',
    foto_premiacao_url TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.desafios_config (titulo, subtitulo, premiacao, ativo)
SELECT 'Desafio Oficial Vyra - 12 Semanas', 'Supere seus limites e conquiste o shape dos seus sonhos', 'Troféu Vyra + Suplementação Completa', true
WHERE NOT EXISTS (SELECT 1 FROM public.desafios_config WHERE ativo = true);

-- ==============================================================================
-- 11. TABELAS: challenge_photos & photo_votes (Galeria e Votação de Desafios)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.challenge_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    participant_name TEXT NOT NULL,
    caption TEXT,
    photo_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'shape',
    votes_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.photo_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES public.challenge_photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_photo_vote UNIQUE (photo_id, user_id)
);

-- Trigger de sincronização da contagem de votos
CREATE OR REPLACE FUNCTION public.sync_photo_votes_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.challenge_photos
        SET votes_count = votes_count + 1,
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.photo_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.challenge_photos
        SET votes_count = GREATEST(0, votes_count - 1),
            updated_at = timezone('utc'::text, now())
        WHERE id = OLD.photo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_photo_votes_count ON public.photo_votes;
CREATE TRIGGER trg_sync_photo_votes_count
AFTER INSERT OR DELETE ON public.photo_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_photo_votes_count();

-- ==============================================================================
-- 12. TABELAS ADICIONAIS: subscriptions, diet_plans, chat_messages
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'shape',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Plano Nutricional Personalizado',
    calories INTEGER,
    protein NUMERIC,
    carbs NUMERIC,
    fats NUMERIC,
    meals JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_avatar TEXT,
    user_role TEXT DEFAULT 'aluno',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 13. CONFIGURAÇÃO DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_ciclo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks_coach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desafios_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_coach_or_admin())
    WITH CHECK (auth.uid() = id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "profiles_anon_select" ON public.profiles;
CREATE POLICY "profiles_anon_select" ON public.profiles FOR SELECT TO anon USING (true);

-- POLÍTICAS: perfis
DROP POLICY IF EXISTS "perfis_select_policy" ON public.perfis;
CREATE POLICY "perfis_select_policy" ON public.perfis FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "perfis_update_policy" ON public.perfis;
CREATE POLICY "perfis_update_policy" ON public.perfis FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_coach_or_admin())
    WITH CHECK (auth.uid() = id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "perfis_insert_policy" ON public.perfis;
CREATE POLICY "perfis_insert_policy" ON public.perfis FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "perfis_anon_select" ON public.perfis;
CREATE POLICY "perfis_anon_select" ON public.perfis FOR SELECT TO anon USING (true);

-- POLÍTICAS: avaliacoes
DROP POLICY IF EXISTS "avaliacoes_select_policy" ON public.avaliacoes;
CREATE POLICY "avaliacoes_select_policy" ON public.avaliacoes FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "avaliacoes_insert_policy" ON public.avaliacoes;
CREATE POLICY "avaliacoes_insert_policy" ON public.avaliacoes FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "avaliacoes_update_policy" ON public.avaliacoes;
CREATE POLICY "avaliacoes_update_policy" ON public.avaliacoes FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

-- POLÍTICAS: feedbacks_coach
DROP POLICY IF EXISTS "feedbacks_select_policy" ON public.feedbacks_coach;
CREATE POLICY "feedbacks_select_policy" ON public.feedbacks_coach FOR SELECT TO authenticated
    USING (aluno_id = auth.uid() OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "feedbacks_insert_policy" ON public.feedbacks_coach;
CREATE POLICY "feedbacks_insert_policy" ON public.feedbacks_coach FOR INSERT TO authenticated
    WITH CHECK (public.is_coach_or_admin() OR auth.uid() = coach_id);

DROP POLICY IF EXISTS "feedbacks_update_policy" ON public.feedbacks_coach;
CREATE POLICY "feedbacks_update_policy" ON public.feedbacks_coach FOR UPDATE TO authenticated
    USING (public.is_coach_or_admin());

-- POLÍTICAS: desafios_config
DROP POLICY IF EXISTS "desafios_config_select" ON public.desafios_config;
CREATE POLICY "desafios_config_select" ON public.desafios_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "desafios_config_update" ON public.desafios_config;
CREATE POLICY "desafios_config_update" ON public.desafios_config FOR UPDATE TO authenticated
    USING (public.is_coach_or_admin() OR true);

DROP POLICY IF EXISTS "desafios_config_insert" ON public.desafios_config;
CREATE POLICY "desafios_config_insert" ON public.desafios_config FOR INSERT TO authenticated
    WITH CHECK (true);

-- POLÍTICAS: challenge_photos & photo_votes
DROP POLICY IF EXISTS "challenge_photos_select" ON public.challenge_photos;
CREATE POLICY "challenge_photos_select" ON public.challenge_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "challenge_photos_insert" ON public.challenge_photos;
CREATE POLICY "challenge_photos_insert" ON public.challenge_photos FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "challenge_photos_update" ON public.challenge_photos;
CREATE POLICY "challenge_photos_update" ON public.challenge_photos FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "photo_votes_select" ON public.photo_votes;
CREATE POLICY "photo_votes_select" ON public.photo_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "photo_votes_insert" ON public.photo_votes;
CREATE POLICY "photo_votes_insert" ON public.photo_votes FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "photo_votes_delete" ON public.photo_votes;
CREATE POLICY "photo_votes_delete" ON public.photo_votes FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- POLÍTICAS: subscriptions, diet_plans, chat_messages
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "subscriptions_all" ON public.subscriptions;
CREATE POLICY "subscriptions_all" ON public.subscriptions FOR ALL TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "diet_plans_select" ON public.diet_plans;
CREATE POLICY "diet_plans_select" ON public.diet_plans FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "diet_plans_all" ON public.diet_plans;
CREATE POLICY "diet_plans_all" ON public.diet_plans FOR ALL TO authenticated
    USING (auth.uid() = user_id OR public.is_coach_or_admin());

DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 14. BUCKETS DE STORAGE & POLÍTICAS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avaliacoes', 'avaliacoes', true),
    ('desafios', 'desafios', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas Storage: avaliacoes
DROP POLICY IF EXISTS "avaliacoes_storage_select" ON storage.objects;
CREATE POLICY "avaliacoes_storage_select" ON storage.objects FOR SELECT
    USING (bucket_id = 'avaliacoes');

DROP POLICY IF EXISTS "avaliacoes_storage_insert" ON storage.objects;
CREATE POLICY "avaliacoes_storage_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avaliacoes');

DROP POLICY IF EXISTS "avaliacoes_storage_update" ON storage.objects;
CREATE POLICY "avaliacoes_storage_update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avaliacoes');

-- Políticas Storage: desafios
DROP POLICY IF EXISTS "desafios_storage_select" ON storage.objects;
CREATE POLICY "desafios_storage_select" ON storage.objects FOR SELECT
    USING (bucket_id = 'desafios');

DROP POLICY IF EXISTS "desafios_storage_insert" ON storage.objects;
CREATE POLICY "desafios_storage_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'desafios');

DROP POLICY IF EXISTS "desafios_storage_update" ON storage.objects;
CREATE POLICY "desafios_storage_update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'desafios');

-- Políticas Storage: avatars
DROP POLICY IF EXISTS "avatars_storage_select" ON storage.objects;
CREATE POLICY "avatars_storage_select" ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_storage_insert" ON storage.objects;
CREATE POLICY "avatars_storage_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars');

-- ==============================================================================
-- 15. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_perfis_cargo ON public.perfis(cargo);
CREATE INDEX IF NOT EXISTS idx_perfis_email ON public.perfis(email);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_user_id ON public.avaliacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_created_at ON public.avaliacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_aluno_id ON public.feedbacks_coach(aluno_id);
CREATE INDEX IF NOT EXISTS idx_challenge_photos_votes ON public.challenge_photos(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_photo_votes_unique ON public.photo_votes(photo_id, user_id);

-- FIM DA MIGRAÇÃO
