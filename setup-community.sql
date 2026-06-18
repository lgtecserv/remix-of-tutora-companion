-- Create the storage bucket for community images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community_images', 'community_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for community_images
CREATE POLICY "Community Images Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'community_images');
CREATE POLICY "Community Images Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community_images' AND auth.role() = 'authenticated');
CREATE POLICY "Community Images Users can update own" ON storage.objects FOR UPDATE USING (bucket_id = 'community_images' AND auth.uid() = owner);
CREATE POLICY "Community Images Users can delete own" ON storage.objects FOR DELETE USING (bucket_id = 'community_images' AND auth.uid() = owner);

-- 1. Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create community_post_likes table
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- 3. Create community_post_comments table
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create community_post_reports table
CREATE TABLE IF NOT EXISTS public.community_post_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Posts are viewable by authenticated users" ON public.community_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_post_likes
CREATE POLICY "Likes are viewable by authenticated users" ON public.community_post_likes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can like posts" ON public.community_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.community_post_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_post_comments
CREATE POLICY "Comments are viewable by authenticated users" ON public.community_post_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create comments" ON public.community_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.community_post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.community_post_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_post_reports
CREATE POLICY "Users can report posts" ON public.community_post_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON public.community_post_reports FOR SELECT USING (auth.uid() = user_id);
