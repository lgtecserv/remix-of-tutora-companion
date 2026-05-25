-- ==========================================
-- SCRIPT DE ATUALIZAÇÃO: SISTEMA DE COMENTÁRIOS
-- ==========================================

-- 1. Criar Tabela de Comentários
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ativar Segurança (RLS) para Comentários
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de acesso para Comentários
DROP POLICY IF EXISTS "Comments viewable by anyone" ON public.comments;
CREATE POLICY "Comments viewable by anyone" ON public.comments 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments" ON public.comments 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments 
    FOR DELETE USING (auth.uid() = user_id);
