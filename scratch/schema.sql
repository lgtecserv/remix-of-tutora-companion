-- ==========================================
-- SUPABASE MIGRATION SCHEMA — TUTORA COMPANION
-- ==========================================

-- 1. CLEANUP (se houver resquícios)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role CASCADE;

-- 2. CREATE ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'aluno');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('mpesa', 'emola', 'transferencia', 'credit_card');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- Alter existing type if it already exists (Postgres allows ADD VALUE)
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'credit_card';

-- 3. CREATE TABLES

-- Profiles (dependent on auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, role)
);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT,
    category TEXT,
    instructor TEXT,
    level TEXT DEFAULT 'Iniciante',
    duration_minutes INTEGER DEFAULT 0,
    target_audience TEXT,
    tags TEXT[] DEFAULT '{}',
    what_you_learn TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    cover_url TEXT,
    is_free BOOLEAN DEFAULT FALSE NOT NULL,
    price_mzn NUMERIC DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    youtube_url TEXT,
    attachment_url TEXT,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, course_id)
);

-- Lesson Progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    percent NUMERIC DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, lesson_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    amount_mzn NUMERIC NOT NULL,
    method payment_method NOT NULL,
    status payment_status DEFAULT 'pending' NOT NULL,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    cover_url TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    is_published BOOLEAN DEFAULT FALSE NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    reading_minutes INTEGER DEFAULT 1 NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. CREATE FUNCTIONS & TRIGGERS

-- Function: has_role (to validate permissions)
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql;

-- Function: handle_new_user (Auto-profile creation and assignment of 'aluno' role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cria o perfil público
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Utilizador'),
        new.raw_user_meta_data->>'avatar_url'
    );

    -- Atribui o papel padrão de 'aluno'
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'aluno');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: on_auth_user_created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES

-- Profiles policies
CREATE POLICY "Profiles are viewable by anyone" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- User Roles policies
CREATE POLICY "Roles viewable by admins and owner" ON public.user_roles
    FOR SELECT USING (public.has_role('admin', auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Roles editable only by admins" ON public.user_roles
    FOR ALL USING (public.has_role('admin', auth.uid()));

-- Courses policies
CREATE POLICY "Courses viewable by anyone if published" ON public.courses
    FOR SELECT USING (is_published = true OR public.has_role('admin', auth.uid()));
CREATE POLICY "Courses editable only by admins" ON public.courses
    FOR ALL USING (public.has_role('admin', auth.uid()));

-- Modules policies
CREATE POLICY "Modules viewable if course is public" ON public.modules
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND (is_published = true OR public.has_role('admin', auth.uid())))
    );
CREATE POLICY "Modules editable only by admins" ON public.modules
    FOR ALL USING (public.has_role('admin', auth.uid()));

-- Lessons policies
CREATE POLICY "Lessons viewable if course is public" ON public.lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON c.id = m.course_id
            WHERE m.id = module_id AND (c.is_published = true OR public.has_role('admin', auth.uid()))
        )
    );
CREATE POLICY "Lessons editable only by admins" ON public.lessons
    FOR ALL USING (public.has_role('admin', auth.uid()));

-- Comments policies
CREATE POLICY "Comments viewable by anyone" ON public.comments
    FOR SELECT USING (is_hidden = false OR public.has_role('admin', auth.uid()));
CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can edit/delete their own comments" ON public.comments
    FOR ALL USING (auth.uid() = user_id OR public.has_role('admin', auth.uid()));

-- Enrollments policies
CREATE POLICY "Enrollments viewable by owner or admin" ON public.enrollments
    FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin', auth.uid()));
CREATE POLICY "Enrollments manageable by owner or admin" ON public.enrollments
    FOR ALL USING (auth.uid() = user_id OR public.has_role('admin', auth.uid()));

-- Lesson Progress policies
CREATE POLICY "Progress viewable by owner or admin" ON public.lesson_progress
    FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin', auth.uid()));
CREATE POLICY "Progress manageable by owner or admin" ON public.lesson_progress
    FOR ALL USING (auth.uid() = user_id OR public.has_role('admin', auth.uid()));

-- Payments policies
CREATE POLICY "Payments viewable by owner or admin" ON public.payments
    FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin', auth.uid()));
CREATE POLICY "Payments editable only by admin" ON public.payments
    FOR ALL USING (public.has_role('admin', auth.uid()));
CREATE POLICY "Authenticated users can create payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blog Posts policies
CREATE POLICY "Blog posts viewable by anyone if published" ON public.blog_posts
    FOR SELECT USING (
        (is_published = true AND (scheduled_at IS NULL OR scheduled_at <= NOW()))
        OR public.has_role('admin', auth.uid())
    );
CREATE POLICY "Blog posts editable only by admins" ON public.blog_posts
    FOR ALL USING (public.has_role('admin', auth.uid()));

-- 7. CREATE EFFICIENT INDEXES FOR INDEXATION & SEO
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_comments_lesson_id ON public.comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING gin (tags);

-- 8. STORAGE BUCKETS & POLICIES (MIGRATION)
-- Garantir que todos os buckets de mídia existam
INSERT INTO storage.buckets (id, name, public) VALUES ('course-covers', 'course-covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-covers', 'blog-covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-videos', 'lesson-videos', true) ON CONFLICT (id) DO NOTHING;

-- Ativar RLS no storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Limpar quaisquer políticas existentes nos nossos buckets para evitar conflitos
DROP POLICY IF EXISTS "Public SELECT Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Lesson Videos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Lesson Videos" ON storage.objects;

-- 1. SELECT: Permitir acesso de leitura público (qualquer pessoa) para os ficheiros dos buckets
CREATE POLICY "Public SELECT Access" ON storage.objects
    FOR SELECT USING (bucket_id IN ('course-covers', 'blog-covers', 'blog-images', 'lesson-videos'));

-- 2. INSERT: Permitir que utilizadores autenticados façam upload
CREATE POLICY "Admin Insert Access" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('course-covers', 'blog-covers', 'blog-images', 'lesson-videos')
        AND auth.role() = 'authenticated'
    );

-- 3. UPDATE: Permitir que utilizadores autenticados atualizem ficheiros
CREATE POLICY "Admin Update Access" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('course-covers', 'blog-covers', 'blog-images', 'lesson-videos')
        AND auth.role() = 'authenticated'
    );

-- 4. DELETE: Permitir que utilizadores autenticados apaguem ficheiros
CREATE POLICY "Admin Delete Access" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('course-covers', 'blog-covers', 'blog-images', 'lesson-videos')
        AND auth.role() = 'authenticated'
    );


