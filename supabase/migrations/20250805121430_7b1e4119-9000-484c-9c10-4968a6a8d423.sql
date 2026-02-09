-- Add uploaded_context column to ticket_attachments table
ALTER TABLE public.ticket_attachments 
ADD COLUMN uploaded_context text DEFAULT 'update' CHECK (uploaded_context IN ('creation', 'update'));

-- Update existing records to have 'creation' context for now
UPDATE public.ticket_attachments 
SET uploaded_context = 'creation';

-- Enable realtime for ticket_attachments table
ALTER TABLE public.ticket_attachments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_attachments;