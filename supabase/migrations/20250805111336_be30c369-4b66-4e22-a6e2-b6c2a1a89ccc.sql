-- Update ticket-attachments bucket to allow image and video uploads
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'text/plain',
  'text/log', 
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/webm'
]
WHERE id = 'ticket-attachments';

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can upload attachments to their ticket folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view attachments for accessible tickets" ON storage.objects;

-- Create storage policies for ticket attachments
CREATE POLICY "Users can upload attachments to their ticket folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view attachments for accessible tickets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id::text = (storage.foldername(name))[2]
      AND (
        t.created_by = auth.uid() 
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users u 
          JOIN roles r ON r.id = u.role_id
          WHERE u.id = auth.uid() 
          AND r.name IN ('lead', 'admin')
        )
      )
    )
  )
);