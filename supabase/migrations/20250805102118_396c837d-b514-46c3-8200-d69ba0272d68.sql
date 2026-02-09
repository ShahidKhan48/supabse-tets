-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments', 
  'ticket-attachments', 
  false, 
  10485760, -- 10MB in bytes
  ARRAY['text/plain', 'text/log', 'application/zip', 'application/x-zip-compressed']
);

-- Create ticket_attachments table
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_attachments
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_attachments
CREATE POLICY "Users can view attachments for tickets they can access" 
ON public.ticket_attachments 
FOR SELECT 
USING (
  ticket_id IN (
    SELECT id FROM public.tickets 
    WHERE (created_by = auth.uid() OR assigned_to = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u 
      JOIN public.roles r ON r.id = u.role_id 
      WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')
    )
  )
);

CREATE POLICY "Users can upload attachments for their tickets" 
ON public.ticket_attachments 
FOR INSERT 
WITH CHECK (uploaded_by = auth.uid());

-- Create storage policies for ticket attachments
CREATE POLICY "Users can upload their own ticket attachments" 
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
  AND EXISTS (
    SELECT 1 FROM public.ticket_attachments ta
    JOIN public.tickets t ON t.id = ta.ticket_id
    WHERE ta.file_path = name
    AND (
      t.created_by = auth.uid() 
      OR t.assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON r.id = u.role_id 
        WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')
      )
    )
  )
);

-- Add INSERT and UPDATE policies for tickets table
CREATE POLICY "Users can create tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own tickets" 
ON public.tickets 
FOR UPDATE 
USING (created_by = auth.uid() OR assigned_to = auth.uid())
WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid());

-- Enable RLS on teams table and add policies
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read teams" 
ON public.teams 
FOR SELECT 
USING (true);

-- Enable RLS on ticket_audit_log and add policies
ALTER TABLE public.ticket_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for accessible tickets" 
ON public.ticket_audit_log 
FOR SELECT 
USING (
  ticket_id IN (
    SELECT id FROM public.tickets 
    WHERE (created_by = auth.uid() OR assigned_to = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u 
      JOIN public.roles r ON r.id = u.role_id 
      WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')
    )
  )
);

CREATE POLICY "System can insert audit logs" 
ON public.ticket_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Enable RLS on ticket_comments and add policies
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for accessible tickets" 
ON public.ticket_comments 
FOR SELECT 
USING (
  ticket_id IN (
    SELECT id FROM public.tickets 
    WHERE (created_by = auth.uid() OR assigned_to = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u 
      JOIN public.roles r ON r.id = u.role_id 
      WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')
    )
  )
);

CREATE POLICY "Users can add comments to accessible tickets" 
ON public.ticket_comments 
FOR INSERT 
WITH CHECK (
  comment_by = auth.uid() 
  AND ticket_id IN (
    SELECT id FROM public.tickets 
    WHERE (created_by = auth.uid() OR assigned_to = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u 
      JOIN public.roles r ON r.id = u.role_id 
      WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')
    )
  )
);

-- Enable RLS on ticket_kb_links and add policies
ALTER TABLE public.ticket_kb_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KB links for accessible tickets" 
ON public.ticket_kb_links 
FOR SELECT 
USING (
  ticket_id IN (
    SELECT id FROM public.tickets 
    WHERE (created_by = auth.uid() OR assigned_to = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u 
      JOIN public.roles r ON r.id = u.role_id 
      WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')
    )
  )
);

CREATE POLICY "Users can create KB links for accessible tickets" 
ON public.ticket_kb_links 
FOR INSERT 
WITH CHECK (
  used_by = auth.uid() 
  AND ticket_id IN (
    SELECT id FROM public.tickets 
    WHERE (created_by = auth.uid() OR assigned_to = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u 
      JOIN public.roles r ON r.id = u.role_id 
      WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')
    )
  )
);