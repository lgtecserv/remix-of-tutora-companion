ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS receipt_url text;

-- Setup storage for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for payment-receipts
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'payment-receipts');
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-receipts');
