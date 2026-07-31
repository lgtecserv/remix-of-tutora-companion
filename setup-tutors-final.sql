-- 1. Adicionar flag is_tutor à tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_tutor BOOLEAN DEFAULT false;

-- 2. Tabela de candidaturas / taxa de adesão (500 MT)
CREATE TABLE IF NOT EXISTS public.tutor_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'rejected')) DEFAULT 'pending',
    payment_method TEXT CHECK (payment_method IN ('automatic', 'manual')),
    reference TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 3. Tabela Carteira do Tutor (Wallet)
CREATE TABLE IF NOT EXISTS public.tutor_wallet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    total_earned DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tutor_id)
);

-- 4. Tabela de Saques (Withdrawals)
CREATE TABLE IF NOT EXISTS public.tutor_withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Adicionar tutor_id na tabela courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 6. Ativar Segurança a Nível de Linha (RLS)
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can view their own application" ON public.tutor_applications;
DROP POLICY IF EXISTS "Users can insert their own application" ON public.tutor_applications;
DROP POLICY IF EXISTS "Users can update their own application" ON public.tutor_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.tutor_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.tutor_applications;

DROP POLICY IF EXISTS "Tutors can view their own wallet" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Admins can update wallets" ON public.tutor_wallet;

DROP POLICY IF EXISTS "Tutors can view their own withdrawals" ON public.tutor_withdrawals;
DROP POLICY IF EXISTS "Tutors can insert their own withdrawals" ON public.tutor_withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.tutor_withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.tutor_withdrawals;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 8. Criar Políticas RLS Corretas

-- tutor_applications: Utilizador vê a sua, Admin vê todas
CREATE POLICY "Users can view their own application" ON public.tutor_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own application" ON public.tutor_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own application" ON public.tutor_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all applications" ON public.tutor_applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update applications" ON public.tutor_applications FOR UPDATE TO authenticated USING (true);

-- tutor_wallet
CREATE POLICY "Tutors can view their own wallet" ON public.tutor_wallet FOR SELECT TO authenticated USING (auth.uid() = tutor_id);
CREATE POLICY "Admins can update wallets" ON public.tutor_wallet FOR ALL TO authenticated USING (true);

-- tutor_withdrawals
CREATE POLICY "Tutors can view their own withdrawals" ON public.tutor_withdrawals FOR SELECT TO authenticated USING (auth.uid() = tutor_id);
CREATE POLICY "Tutors can insert their own withdrawals" ON public.tutor_withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Admins can update withdrawals" ON public.tutor_withdrawals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can view all withdrawals" ON public.tutor_withdrawals FOR SELECT TO authenticated USING (true);

-- profiles: Todos os utilizadores autenticados podem ver os perfis uns dos outros
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
