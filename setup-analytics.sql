-- Analytics Setup for Imersão Completa

-- 1. Add view and click counters to blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Add view and click counters to custom_banners
ALTER TABLE public.custom_banners 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0 NOT NULL;

-- 3. Create an RPC function to atomically increment blog_posts counters
CREATE OR REPLACE FUNCTION increment_post_stat(p_post_id UUID, p_stat_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_stat_type = 'view' THEN
    UPDATE public.blog_posts SET views_count = views_count + 1 WHERE id = p_post_id;
  ELSIF p_stat_type = 'click' THEN
    UPDATE public.blog_posts SET clicks_count = clicks_count + 1 WHERE id = p_post_id;
  END IF;
END;
$$;

-- 4. Create an RPC function to atomically increment custom_banners counters
CREATE OR REPLACE FUNCTION increment_banner_stat(p_banner_id UUID, p_stat_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_stat_type = 'view' THEN
    UPDATE public.custom_banners SET views_count = views_count + 1 WHERE id = p_banner_id;
  ELSIF p_stat_type = 'click' THEN
    UPDATE public.custom_banners SET clicks_count = clicks_count + 1 WHERE id = p_banner_id;
  END IF;
END;
$$;

-- Grant permissions for public access to the RPCs
GRANT EXECUTE ON FUNCTION increment_post_stat TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_banner_stat TO anon, authenticated;
