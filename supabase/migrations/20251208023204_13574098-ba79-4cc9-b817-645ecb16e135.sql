-- Add SELECT policy for super_admin to view all user_roles
CREATE POLICY "Super admin can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));