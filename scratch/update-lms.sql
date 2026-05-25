-- ==========================================
-- SCRIPT DE ATUALIZAÇÃO DO SISTEMA DE CURSOS
-- ==========================================

-- 1. Criar Tabela de Instrutores
CREATE TABLE IF NOT EXISTS public.instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ativar Segurança (RLS) para Instrutores
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para Instrutores
DROP POLICY IF EXISTS "Instructors viewable by anyone" ON public.instructors;
CREATE POLICY "Instructors viewable by anyone" ON public.instructors 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors editable only by admins" ON public.instructors;
CREATE POLICY "Instructors editable only by admins" ON public.instructors 
    FOR ALL USING (public.has_role('admin', auth.uid()));

-- 2. Adicionar novos campos na tabela de Cursos (Courses)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'Português';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS has_certificate BOOLEAN DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL;

-- 3. Adicionar novos campos na tabela de Aulas (Lessons)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
