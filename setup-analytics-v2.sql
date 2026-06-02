-- Analytics Setup V2 (Time-Series) for Imersão Completa

-- 1. Create the new analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'banner')),
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  session_id TEXT,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown'))
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON public.analytics_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- 2. Create the unified RPC function for advanced tracking
CREATE OR REPLACE FUNCTION log_analytics_event(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_event_type TEXT,
  p_session_id TEXT,
  p_referrer TEXT,
  p_device_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Insert the detailed event
  INSERT INTO public.analytics_events (
    entity_type, entity_id, event_type, session_id, referrer, device_type
  ) VALUES (
    p_entity_type, p_entity_id, p_event_type, p_session_id, p_referrer, p_device_type
  );

  -- 2. Keep absolute counters up to date automatically
  IF p_entity_type = 'post' THEN
    IF p_event_type = 'view' THEN
      UPDATE public.blog_posts SET views_count = views_count + 1 WHERE id = p_entity_id;
    ELSIF p_event_type = 'click' THEN
      UPDATE public.blog_posts SET clicks_count = clicks_count + 1 WHERE id = p_entity_id;
    END IF;
  ELSIF p_entity_type = 'banner' THEN
    IF p_event_type = 'view' THEN
      UPDATE public.custom_banners SET views_count = views_count + 1 WHERE id = p_entity_id;
    ELSIF p_event_type = 'click' THEN
      UPDATE public.custom_banners SET clicks_count = clicks_count + 1 WHERE id = p_entity_id;
    END IF;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION log_analytics_event TO anon, authenticated;
-- Allow anon and auth users to read events (for the admin dashboard later)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.analytics_events FOR SELECT USING (true);
-- Note: Insert is handled by the SECURITY DEFINER RPC, so we don't need a direct INSERT policy.
