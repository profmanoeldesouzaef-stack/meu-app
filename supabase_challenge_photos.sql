-- ==============================================================================
-- SCHEMA SUPABASE: GALERIA E VOTAÇÃO DE FOTOS DE DESAFIOS (COM LÓGICA DE TOGGLE)
-- ==============================================================================

-- 1. Habilita extensão de UUID (caso ainda não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela: challenge_photos
-- Armazena as fotos enviadas pelos participantes dos desafios
CREATE TABLE IF NOT EXISTS public.challenge_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    participant_name TEXT NOT NULL,
    caption TEXT,
    photo_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'shape', -- 'shape', 'force', 'reset12'
    votes_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela: photo_votes
-- Armazena os votos de cada usuário. A constraint UNIQUE(photo_id, user_id)
-- garante que cada usuário só pode votar uma única vez por foto,
-- permitindo a lógica de 'toggle' (se já existe, deleta; se não existe, insere).
CREATE TABLE IF NOT EXISTS public.photo_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES public.challenge_photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Constraint essencial para o mecanismo de toggle anti-duplicação:
    CONSTRAINT unique_user_photo_vote UNIQUE (photo_id, user_id)
);

-- 4. Índices para Otimização de Performance
-- Índice para acelerar a listagem ordenada de fotos por quantidade de votos (decrescente)
CREATE INDEX IF NOT EXISTS idx_challenge_photos_votes_desc 
    ON public.challenge_photos (votes_count DESC);

-- Índice para acelerar a filtragem por categoria
CREATE INDEX IF NOT EXISTS idx_challenge_photos_category 
    ON public.challenge_photos (category);

-- Índices para busca ultra-rápida de votos no toggle
CREATE INDEX IF NOT EXISTS idx_photo_votes_photo_user 
    ON public.photo_votes (photo_id, user_id);

CREATE INDEX IF NOT EXISTS idx_photo_votes_photo_id 
    ON public.photo_votes (photo_id);

-- 5. Trigger para Atualização Automática de 'votes_count'
-- Mantém a coluna votes_count em challenge_photos sincronizada automaticamente
CREATE OR REPLACE FUNCTION public.sync_photo_votes_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger anterior se existir e recria
DROP TRIGGER IF EXISTS trg_sync_photo_votes_count ON public.photo_votes;
CREATE TRIGGER trg_sync_photo_votes_count
AFTER INSERT OR DELETE ON public.photo_votes
FOR EACH ROW
EXECUTE FUNCTION public.sync_photo_votes_count();

-- 6. Row Level Security (RLS)
ALTER TABLE public.challenge_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para challenge_photos:
-- Leitura pública das fotos aprovadas
CREATE POLICY "Public read approved photos"
    ON public.challenge_photos FOR SELECT
    TO public
    USING (status = 'approved');

-- Usuários autenticados podem submeter fotos
CREATE POLICY "Authenticated users can submit photos"
    ON public.challenge_photos FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias fotos
CREATE POLICY "Users can update own photos"
    ON public.challenge_photos FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Políticas para photo_votes:
-- Leitura pública dos votos
CREATE POLICY "Public read votes"
    ON public.photo_votes FOR SELECT
    TO public
    USING (true);

-- Usuários autenticados podem inserir voto (curtir)
CREATE POLICY "Authenticated users can vote"
    ON public.photo_votes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Usuários autenticados podem deletar apenas seu próprio voto (descurtir / toggle)
CREATE POLICY "Authenticated users can remove own vote"
    ON public.photo_votes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ==============================================================================
-- SEED DATA INICIAL (Demonstração com fotos do Desafio Vyra)
-- ==============================================================================
INSERT INTO public.challenge_photos (id, participant_name, caption, photo_url, category, votes_count)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Camila Siqueira', 'Evolução de 16 semanas com o protocolo Vyra Shape. Foco em glúteos e definição abdominal!', 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80', 'shape', 428),
    ('a0000002-0000-0000-0000-000000000002', 'Diego Pinheiro', 'Bulk limpo no Forge Protocol. Ganho de 5.4kg de massa magra mantendo o percentual de gordura.', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80', 'force', 382),
    ('a0000003-0000-0000-0000-000000000003', 'Larissa Mendes', '12 semanas do Projeto Reset 12! Recomposição física e disciplina na dieta.', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80', 'reset12', 315),
    ('a0000004-0000-0000-0000-000000000004', 'Mariana Rocha', 'Transformação no Vyra Shape! -7cm de cintura e máxima simetria corporal.', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80', 'shape', 290),
    ('a0000005-0000-0000-0000-000000000005', 'Rafael Menezes', 'Densidade muscular nas costas e peito após 10 semanas de sobrecarga progressiva.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80', 'force', 244),
    ('a0000006-0000-0000-0000-000000000006', 'Beatriz Cardoso', 'Reset 12 Semanas concluído! Foco total na consistência alimentar e treino diário.', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', 'reset12', 198)
ON CONFLICT (id) DO NOTHING;
