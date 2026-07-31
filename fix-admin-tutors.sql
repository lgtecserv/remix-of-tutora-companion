-- Este script corrige as políticas RLS para garantir que os administradores possam ver as candidaturas de tutores.
-- Execute-o no SQL Editor do Supabase.

-- 1. Tabela tutor_applications
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all applications" ON public.tutor_applications;
CREATE POLICY "Admins can view all applications" ON public.tutor_applications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can update applications" ON public.tutor_applications;
CREATE POLICY "Admins can update applications" ON public.tutor_applications FOR UPDATE TO authenticated USING (true);

-- 2. Tabela profiles (Necessário para o JOIN trazer os nomes e emails dos tutores)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
-- 'USING (true)' sem restrição TO permite a qualquer utilizador ler os perfis, 
-- essencial para os joins no painel de admin ou para os fóruns/comunidade.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
