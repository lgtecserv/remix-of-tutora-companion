-- 1. Remover as colunas antigas (que causavam confusão)
ALTER TABLE public.tutor_wallet DROP COLUMN IF EXISTS payment_method;
ALTER TABLE public.tutor_wallet DROP COLUMN IF EXISTS payment_number;

-- 2. Adicionar as novas colunas para suportar ambos os números simultaneamente
ALTER TABLE public.tutor_wallet ADD COLUMN IF NOT EXISTS mpesa_number TEXT;
ALTER TABLE public.tutor_wallet ADD COLUMN IF NOT EXISTS emola_number TEXT;

-- 3. Adicionar as colunas no histórico de saques para saber para onde o dinheiro foi
ALTER TABLE public.tutor_withdrawals ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.tutor_withdrawals ADD COLUMN IF NOT EXISTS payment_number TEXT;

-- Garantir que as políticas estão limpas e a funcionar
DROP POLICY IF EXISTS "Tutors can view their own wallet" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Admins can update wallets" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Tutors can insert their own wallet" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Tutors can update their own wallet" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Tutor full access to own wallet" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Admin full access to all wallets" ON public.tutor_wallet;

CREATE POLICY "Tutor full access to own wallet" ON public.tutor_wallet FOR ALL TO authenticated USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Admin full access to all wallets" ON public.tutor_wallet FOR ALL TO authenticated USING (true) WITH CHECK (true);
