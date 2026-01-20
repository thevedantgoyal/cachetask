-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for evidence bucket
CREATE POLICY "Users can upload their own evidence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own evidence"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own evidence"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

-- HR and Admin can view all evidence
CREATE POLICY "HR and Admin can view all evidence"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' 
  AND (
    public.has_role(auth.uid(), 'hr') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Managers can view their team's evidence
CREATE POLICY "Managers can view team evidence"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' 
  AND public.has_role(auth.uid(), 'manager')
  AND public.is_manager_of(auth.uid(), (storage.foldername(name))[1]::uuid)
);