-- Fase 2: Evolução da Comunidade

-- 1. Adicionar colunas na tabela community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;

-- 2. Adicionar coluna na tabela notifications (caso a tabela notifications já exista na plataforma)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS community_post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE;

-- 3. Função e Trigger para Notificação de Curtidas
CREATE OR REPLACE FUNCTION public.handle_community_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Descobre o autor do post
  SELECT user_id INTO post_author_id FROM public.community_posts WHERE id = NEW.post_id;

  -- Se quem curtiu não for o próprio autor, cria a notificação
  IF post_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, community_post_id, message, is_read)
    VALUES (post_author_id, 'community_like', NEW.user_id, NEW.post_id, 'Alguém curtiu sua postagem na comunidade.', false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_community_like ON public.community_post_likes;
CREATE TRIGGER on_community_like
  AFTER INSERT ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_community_like_notification();

-- 4. Função e Trigger para Notificação de Comentários
CREATE OR REPLACE FUNCTION public.handle_community_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  parent_comment_author_id UUID;
BEGIN
  -- Notifica o autor do Post
  SELECT user_id INTO post_author_id FROM public.community_posts WHERE id = NEW.post_id;
  
  IF post_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, community_post_id, comment_id, message, is_read)
    VALUES (post_author_id, 'community_comment', NEW.user_id, NEW.post_id, NEW.id, 'Alguém comentou na sua postagem.', false);
  END IF;

  -- Se for resposta a um comentário, notifica o autor do comentário original
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_comment_author_id FROM public.community_post_comments WHERE id = NEW.parent_id;
    
    -- Só notifica se a resposta for para outra pessoa e se não for o próprio autor do post (para evitar notificação duplicada)
    IF parent_comment_author_id != NEW.user_id AND parent_comment_author_id != post_author_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, community_post_id, comment_id, message, is_read)
      VALUES (parent_comment_author_id, 'community_reply', NEW.user_id, NEW.post_id, NEW.id, 'Alguém respondeu ao seu comentário.', false);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_community_comment ON public.community_post_comments;
CREATE TRIGGER on_community_comment
  AFTER INSERT ON public.community_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_community_comment_notification();
