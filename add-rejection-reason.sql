-- Adicionar a coluna de motivo de rejeição à tabela de candidaturas de tutores
ALTER TABLE public.tutor_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
