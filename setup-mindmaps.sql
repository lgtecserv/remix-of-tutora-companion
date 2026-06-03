-- SQL para criar a tabela de Mapas Mentais (mind_maps)
-- Copie este ficheiro inteiro e corra no Editor SQL do Supabase.

CREATE TABLE IF NOT EXISTS public.mind_maps (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  course_id uuid NULL,
  module_id uuid NULL,
  lesson_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT mind_maps_pkey PRIMARY KEY (id),
  CONSTRAINT mind_maps_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL,
  CONSTRAINT mind_maps_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL,
  CONSTRAINT mind_maps_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL
);

-- Ativar RLS
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança: Apenas utilizadores autenticados podem interagir (Admins)
-- Como o painel inteiro é protegido, vamos permitir gestão completa para os professores/admins.

CREATE POLICY "Enable all for authenticated users only" ON public.mind_maps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar tipo no schema do TypeScript (opicional, mas bom documentar)
-- Este ficheiro serve para correr manualmente no painel Supabase > SQL Editor
