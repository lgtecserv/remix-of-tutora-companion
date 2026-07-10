-- Fase 3: Comunidade Hub (Publicidade, Avisos e Postagens Fixadas)

-- 1. Adicionar coluna is_pinned em community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 2. Criar a tabela de anúncios da comunidade (community_ads)
CREATE TABLE IF NOT EXISTS public.community_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    placement TEXT NOT NULL CHECK (placement IN ('global_top', 'sidebar', 'feed')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança RLS (Row Level Security)
ALTER TABLE public.community_ads ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer visitante autenticado ou público veja os anúncios ativos
CREATE POLICY "Public community ads are viewable by everyone" 
ON public.community_ads FOR SELECT 
USING (is_active = true);

-- Permitir que Administradores (Autenticados) façam tudo (inserir, atualizar, apagar)
CREATE POLICY "Admins can insert ads" ON public.community_ads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update ads" ON public.community_ads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete ads" ON public.community_ads FOR DELETE TO authenticated USING (true);
CREATE POLICY "Admins can select all ads" ON public.community_ads FOR SELECT TO authenticated USING (true);
