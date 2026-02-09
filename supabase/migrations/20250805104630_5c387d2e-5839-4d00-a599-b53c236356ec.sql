-- Fix security warnings by setting search_path for both functions
CREATE OR REPLACE FUNCTION public.set_sla_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deadline_hours INT;
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

CREATE OR REPLACE FUNCTION public.reassign_ticket(ticket uuid, new_user uuid, changed_by uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tickets
  SET assigned_to = new_user
  WHERE id = ticket;

  INSERT INTO ticket_audit_log (ticket_id, action, changed_by, meta)
  VALUES (ticket, 'reassigned', changed_by, jsonb_build_object('new_assignee', new_user));
END;
$$;