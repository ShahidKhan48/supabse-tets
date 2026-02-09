-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
  
  -- Insert into users table
  INSERT INTO public.users (id, email, name, role_id, status)
  VALUES (NEW.id, NEW.email, user_name, role_id_val, 'active');
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user records on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();