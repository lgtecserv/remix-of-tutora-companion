-- ==========================================
-- STORAGE POLICIES MIGRATION — TUTORA COMPANION
-- ==========================================

-- Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies for our buckets to avoid conflicts
DROP POLICY IF EXISTS "Public SELECT Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;

-- 1. SELECT Policy: Allow anyone (public) to view/download media from our buckets
CREATE POLICY "Public SELECT Access" ON storage.objects
    FOR SELECT USING (bucket_id IN ('course-covers', 'blog-covers', 'blog-images', 'lesson-videos'));

-- 2. INSERT Policy: Allow authenticated users (like our admin) to upload media
CREATE POLICY "Admin Insert Access" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('course-covers', 'blog-covers', 'blog-images', 'lesson-videos')
        AND auth.role() = 'authenticated'
    );

-- 3. UPDATE Policy: Allow authenticated users to update existing media
CREATE POLICY "Admin Update Access" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('course-covers', 'blog-covers', 'blog-images', 'lesson-videos')
        AND auth.role() = 'authenticated'
    );

-- 4. DELETE Policy: Allow authenticated users to delete media
CREATE POLICY "Admin Delete Access" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('course-covers', 'blog-covers', 'blog-images', 'lesson-videos')
        AND auth.role() = 'authenticated'
    );
