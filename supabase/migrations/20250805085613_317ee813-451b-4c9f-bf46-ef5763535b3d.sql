-- Enable RLS on all tables and create policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urgency_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledgebase_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_kb_links ENABLE ROW LEVEL SECURITY;

-- Create policies for roles table (readable by all authenticated users)
CREATE POLICY "Allow authenticated users to read roles" 
ON public.roles 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policies for categories table (readable by all authenticated users)
CREATE POLICY "Allow authenticated users to read categories" 
ON public.categories 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policies for urgency_levels table (readable by all authenticated users)
CREATE POLICY "Allow authenticated users to read urgency levels" 
ON public.urgency_levels 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policies for knowledgebase_articles table (readable by all authenticated users)
CREATE POLICY "Allow authenticated users to read KB articles" 
ON public.knowledgebase_articles 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policies for ticket_comments table (users can read comments on tickets they have access to)
CREATE POLICY "Allow users to read ticket comments" 
ON public.ticket_comments 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM tickets t 
    WHERE t.id = ticket_id 
    AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR 
         EXISTS (SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id 
                WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')))
  )
);

-- Create policies for ticket_audit_log table (users can read audit logs for tickets they have access to)
CREATE POLICY "Allow users to read ticket audit logs" 
ON public.ticket_audit_log 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM tickets t 
    WHERE t.id = ticket_id 
    AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR 
         EXISTS (SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id 
                WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')))
  )
);

-- Create policies for ticket_kb_links table (users can read KB links for tickets they have access to)
CREATE POLICY "Allow users to read ticket KB links" 
ON public.ticket_kb_links 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM tickets t 
    WHERE t.id = ticket_id 
    AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR 
         EXISTS (SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id 
                WHERE u.id = auth.uid() AND r.name IN ('lead', 'admin')))
  )
);

-- Function to handle new user signup and create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create a user record with default agent role when someone signs up
  INSERT INTO public.users (id, email, name, role_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    1  -- Default to agent role (role_id = 1)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also handle existing authenticated users who don't have a profile yet
INSERT INTO public.users (id, email, name, role_id)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  1  -- Default to agent role
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- Allow users to read their own profile and other profiles (for team visibility)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
CREATE POLICY "Allow authenticated users to read user profiles" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());