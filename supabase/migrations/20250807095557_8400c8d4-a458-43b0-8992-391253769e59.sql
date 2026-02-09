-- Fix the SLA deadline calculation to properly work with IST timezone
CREATE OR REPLACE FUNCTION public.set_sla_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deadline_hours INT;
BEGIN
  SELECT urgency_levels.sla_hours INTO deadline_hours 
  FROM urgency_levels 
  WHERE urgency_levels.id = NEW.urgency_id;
  
  IF deadline_hours IS NULL THEN
    RAISE EXCEPTION 'SLA not defined for urgency_id = %', NEW.urgency_id;
  END IF;
  
  -- Calculate SLA deadline by adding hours directly to the created_at time in IST
  -- Convert UTC created_at to IST, add hours, then convert back to UTC for storage
  NEW.sla_deadline := (
    (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') + 
    (deadline_hours || ' hours')::interval
  ) AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC';
  
  RETURN NEW;
END;
$function$;