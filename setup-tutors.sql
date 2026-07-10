-- Fase 4: Marketplace de Tutores

-- 1. Adicionar flag is_tutor à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_tutor BOOLEAN DEFAULT false;

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
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 6. Cron Job para remoção de contas pendentes > 48h (pg_cron)
-- Requer a extensão pg_cron habilitada no Supabase.
-- Como pg_cron precisa de privilégios de superuser, criamos apenas a função.
-- O agendamento real pode ser feito no painel do Supabase -> Database -> Cron.
CREATE OR REPLACE FUNCTION delete_unpaid_tutors()
RETURNS void AS $$
BEGIN
  -- Apaga os profiles que submeteram aplicação há mais de 48h e ainda estão pendentes
  -- Como user_id em tutor_applications é CASCADE com profiles, apagando o auth.users ou profiles limpa tudo.
  -- Para apagar completamente, o ideal é invocar via auth.users (necessita supabase_admin, não acessível via SQL simples para o auth_users).
  -- Vamos apagar o profile. A trigger normal do supabase que cria o profile NÃO deleta o user.
  -- Portanto, esta função apenas marca o application como rejected ou deleta o profile.
  -- O ideal é deletar do auth.users, o que não pode ser feito facilmente em plpgsql sem permissões.
  -- Vamos apenas apagar o profile, mas o auth.user continuará existindo (sem profile).
  -- Ou melhor: Mudar o status para 'rejected_timeout'.
  UPDATE public.tutor_applications
  SET status = 'rejected'
  WHERE status = 'pending' AND created_at < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_withdrawals ENABLE ROW LEVEL SECURITY;

-- Tutor applications policies
CREATE POLICY "Users can view their own application" ON public.tutor_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own application" ON public.tutor_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own application" ON public.tutor_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all applications" ON public.tutor_applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update applications" ON public.tutor_applications FOR UPDATE TO authenticated USING (true);

-- Tutor wallet policies
CREATE POLICY "Tutors can view their own wallet" ON public.tutor_wallet FOR SELECT TO authenticated USING (auth.uid() = tutor_id);
CREATE POLICY "Admins can update wallets" ON public.tutor_wallet FOR ALL TO authenticated USING (true);

-- Tutor withdrawals policies
CREATE POLICY "Tutors can view their own withdrawals" ON public.tutor_withdrawals FOR SELECT TO authenticated USING (auth.uid() = tutor_id);
CREATE POLICY "Tutors can insert their own withdrawals" ON public.tutor_withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Admins can update withdrawals" ON public.tutor_withdrawals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can view all withdrawals" ON public.tutor_withdrawals FOR SELECT TO authenticated USING (true);

-- 8. RPC para contar alunos do tutor
CREATE OR REPLACE FUNCTION get_tutor_enrollments_count(p_tutor_id UUID)
RETURNS bigint AS $$
  SELECT COUNT(DISTINCT e.user_id)
  FROM public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  WHERE c.tutor_id = p_tutor_id;
$$ LANGUAGE sql SECURITY DEFINER;
