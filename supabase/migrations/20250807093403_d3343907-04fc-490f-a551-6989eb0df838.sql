-- Update RLS policy to allow all authenticated users to view all tickets
DROP POLICY IF EXISTS "Agent can access own tickets" ON tickets;

-- Create new policy allowing all authenticated users to view all tickets
CREATE POLICY "All authenticated users can view all tickets" 
ON tickets 
FOR SELECT 
TO authenticated 
USING (true);