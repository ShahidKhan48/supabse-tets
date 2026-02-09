-- Update the SLA deadline function to use IST timezone
CREATE OR REPLACE FUNCTION public.set_sla_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  deadline_hours INT;
  ist_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT urgency_levels.sla_hours INTO deadline_hours 
  FROM urgency_levels 
  WHERE urgency_levels.id = NEW.urgency_id;
  
  IF deadline_hours IS NULL THEN
    RAISE EXCEPTION 'SLA not defined for urgency_id = %', NEW.urgency_id;
  END IF;
  
  -- Convert created_at to IST timezone and calculate deadline
  ist_created_at := NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata';
  NEW.sla_deadline := (ist_created_at + (deadline_hours || ' hours')::interval) AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC';
  
  RETURN NEW;
END;
$$;