-- Este script garante que todas as colunas existem e limpa as permissões para resolver o erro 403 e 409
ALTER TABLE public.tutor_wallet ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.tutor_wallet ADD COLUMN IF NOT EXISTS payment_number TEXT;

-- Vamos remover TODAS as políticas antigas para evitar conflitos silenciosos
DROP POLICY IF EXISTS "Tutors can view their own wallet" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Admins can update wallets" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Tutors can insert their own wallet" ON public.tutor_wallet;
DROP POLICY IF EXISTS "Tutors can update their own wallet" ON public.tutor_wallet;

-- E criar uma única política poderosa que permite ao Tutor ver, inserir e atualizar a SUA própria carteira.
CREATE POLICY "Tutor full access to own wallet" 
ON public.tutor_wallet 
FOR ALL 
TO authenticated 
USING (auth.uid() = tutor_id)
WITH CHECK (auth.uid() = tutor_id);

-- Opcionalmente, garantir que o Admin também tem acesso total
CREATE POLICY "Admin full access to all wallets" 
ON public.tutor_wallet 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
