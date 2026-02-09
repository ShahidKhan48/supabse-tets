-- Fix the set_sla_deadline function to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION public.set_sla_deadline()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  deadline_hours INT;  -- Renamed from sla_hours to avoid conflict
BEGIN
  SELECT urgency_levels.sla_hours INTO deadline_hours 
  FROM urgency_levels 
  WHERE urgency_levels.id = NEW.urgency_id;
  
  IF deadline_hours IS NULL THEN
    RAISE EXCEPTION 'SLA not defined for urgency_id = %', NEW.urgency_id;
  END IF;
  
  NEW.sla_deadline := NEW.created_at + (deadline_hours || ' hours')::interval;
  RETURN NEW;
END;
$$;