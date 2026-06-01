-- Criação da tabela de Anúncios Próprios
CREATE TABLE public.custom_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    placement TEXT NOT NULL CHECK (placement IN ('middle', 'end')),
    target_category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança RLS (Row Level Security)
ALTER TABLE public.custom_banners ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer visitante (público) veja os anúncios ativos
CREATE POLICY "Public banners are viewable by everyone." 
ON public.custom_banners FOR SELECT 
USING (is_active = true);

-- Permitir que Administradores (Autenticados) façam tudo (inserir, atualizar, apagar)
CREATE POLICY "Admins can insert" ON public.custom_banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update" ON public.custom_banners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete" ON public.custom_banners FOR DELETE TO authenticated USING (true);
CREATE POLICY "Admins can select all" ON public.custom_banners FOR SELECT TO authenticated USING (true);
