-- Add display_id column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN display_id TEXT;

-- Create ticket_counters table to track sequential numbers per category
CREATE TABLE public.ticket_counters (
  category_id INTEGER PRIMARY KEY REFERENCES public.categories(id),
  next_number INTEGER NOT NULL DEFAULT 1
);

-- Enable RLS on ticket_counters
ALTER TABLE public.ticket_counters ENABLE ROW LEVEL SECURITY;

-- Create policy for ticket_counters (system access only)
CREATE POLICY "System can manage ticket counters" 
ON public.ticket_counters 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to get next ticket number for a category
CREATE OR REPLACE FUNCTION public.get_next_ticket_number(p_category_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Insert category if it doesn't exist in counters
  INSERT INTO ticket_counters (category_id, next_number)
  VALUES (p_category_id, 1)
  ON CONFLICT (category_id) DO NOTHING;
  
  -- Get and increment the counter atomically
  UPDATE ticket_counters 
  SET next_number = next_number + 1
  WHERE category_id = p_category_id
  RETURNING next_number - 1 INTO next_num;
  
  RETURN next_num;
END;
$$;

-- Create function to generate display_id
CREATE OR REPLACE FUNCTION public.generate_ticket_display_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  category_name TEXT;
  ticket_number INTEGER;
BEGIN
  -- Get category name
  SELECT name INTO category_name 
  FROM categories 
  WHERE id = NEW.category_id;
  
  -- Get next ticket number for this category
  SELECT get_next_ticket_number(NEW.category_id) INTO ticket_number;
  
  -- Set the display_id
  NEW.display_id := category_name || ' - ' || ticket_number;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate display_id
CREATE TRIGGER set_ticket_display_id
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_display_id();

-- Backfill existing tickets with display_ids
DO $$
DECLARE
  ticket_record RECORD;
  category_name TEXT;
  ticket_number INTEGER;
BEGIN
  -- Process existing tickets in creation order
  FOR ticket_record IN 
    SELECT t.id, t.category_id, t.created_at
    FROM tickets t
    WHERE t.display_id IS NULL
    ORDER BY t.created_at ASC
  LOOP
    -- Get category name
    SELECT name INTO category_name 
    FROM categories 
    WHERE id = ticket_record.category_id;
    
    -- Get next number for this category
    SELECT get_next_ticket_number(ticket_record.category_id) INTO ticket_number;
    
    -- Update the ticket with display_id
    UPDATE tickets 
    SET display_id = category_name || ' - ' || ticket_number
    WHERE id = ticket_record.id;
  END LOOP;
END;
$$;