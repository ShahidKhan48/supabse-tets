-- Update the Auth context to check if user is enabled before allowing login
-- First, let's ensure the users table has an 'enabled' column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

-- Create an edge function to create users by admin without affecting admin session
-- This will be handled by the edge function we'll create next

-- Update the handle_new_user_signup function to set enabled status
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  role_id_val integer;
  user_name text;
  user_role text;
BEGIN
  -- Extract user metadata
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'agent');
  
  -- Get role ID, default to agent if not found
  SELECT id INTO role_id_val FROM roles WHERE name = user_role;
  IF role_id_val IS NULL THEN
    SELECT id INTO role_id_val FROM roles WHERE name = 'agent';
  END IF;
  
  -- Insert into users table with enabled status (default true for regular signup, can be overridden)
  INSERT INTO public.users (id, email, name, role_id, status, enabled)
  VALUES (NEW.id, NEW.email, user_name, role_id_val, 'active', COALESCE(NEW.raw_user_meta_data->>'enabled', 'true')::boolean);
  
  RETURN NEW;
END;
$function$;