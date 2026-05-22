
-- Courses new fields
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS what_you_learn text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requirements text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Blog posts new fields
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reading_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('course-covers', 'course-covers', true),
  ('blog-covers', 'blog-covers', true),
  ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read; admin write)
DO $$
BEGIN
  -- Public read for all three buckets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='public read course/blog assets') THEN
    CREATE POLICY "public read course/blog assets" ON storage.objects
      FOR SELECT USING (bucket_id IN ('course-covers','blog-covers','blog-images'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin insert course/blog assets') THEN
    CREATE POLICY "admin insert course/blog assets" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id IN ('course-covers','blog-covers','blog-images') AND public.has_role(auth.uid(),'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin update course/blog assets') THEN
    CREATE POLICY "admin update course/blog assets" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id IN ('course-covers','blog-covers','blog-images') AND public.has_role(auth.uid(),'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin delete course/blog assets') THEN
    CREATE POLICY "admin delete course/blog assets" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id IN ('course-covers','blog-covers','blog-images') AND public.has_role(auth.uid(),'admin'));
  END IF;
END$$;

-- Self-enrol for free published courses
CREATE POLICY "enrollments self insert free"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.is_free = true AND c.is_published = true
    )
  );
