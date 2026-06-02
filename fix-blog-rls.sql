-- Corrigir a política de segurança (RLS) para permitir que visitantes (como o WhatsApp) leiam os posts do blog
DROP POLICY IF EXISTS "Leitura pública de posts publicados" ON public.blog_posts;

CREATE POLICY "Leitura pública de posts publicados" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true);
