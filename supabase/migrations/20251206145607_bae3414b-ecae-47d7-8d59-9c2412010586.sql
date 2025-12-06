-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = 'super_admin'
  )
$$;

-- Update function to get user's RT ID
CREATE OR REPLACE FUNCTION public.get_user_rt_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rt_id FROM public.user_roles WHERE user_id = _user_id AND role::text = 'admin' LIMIT 1
$$;

-- RLS Policies for rt table
CREATE POLICY "Super admin can manage all RT"
ON public.rt FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin can view own RT"
ON public.rt FOR SELECT
USING (id IN (SELECT rt_id FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin'));

-- Update RLS Policies for rumah table
DROP POLICY IF EXISTS "Admin can manage all rumah" ON public.rumah;
DROP POLICY IF EXISTS "Warga can view own rumah" ON public.rumah;

CREATE POLICY "Super admin can manage all rumah"
ON public.rumah FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin can manage rumah in own RT"
ON public.rumah FOR ALL
USING (rt_id IN (SELECT rt_id FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin'));

CREATE POLICY "Warga can view own rumah"
ON public.rumah FOR SELECT
USING (user_id = auth.uid());

-- Update RLS Policies for kategori_iuran table
DROP POLICY IF EXISTS "Admin can manage kategori" ON public.kategori_iuran;
DROP POLICY IF EXISTS "Everyone can view kategori" ON public.kategori_iuran;

CREATE POLICY "Super admin can manage all kategori"
ON public.kategori_iuran FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin can manage kategori in own RT"
ON public.kategori_iuran FOR ALL
USING (rt_id IN (SELECT rt_id FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin'));

CREATE POLICY "Warga can view kategori from own RT"
ON public.kategori_iuran FOR SELECT
USING (rt_id IN (
  SELECT r.rt_id FROM public.rumah r WHERE r.user_id = auth.uid()
));

-- Update RLS Policies for buku_kas table
DROP POLICY IF EXISTS "Admin can manage buku kas" ON public.buku_kas;

CREATE POLICY "Super admin can manage all buku kas"
ON public.buku_kas FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin can manage buku kas in own RT"
ON public.buku_kas FOR ALL
USING (rt_id IN (SELECT rt_id FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin'));

-- Update RLS Policies for tagihan table
DROP POLICY IF EXISTS "Admin can manage all tagihan" ON public.tagihan;
DROP POLICY IF EXISTS "Warga can view own tagihan" ON public.tagihan;

CREATE POLICY "Super admin can manage all tagihan"
ON public.tagihan FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin can manage tagihan in own RT"
ON public.tagihan FOR ALL
USING (rumah_id IN (
  SELECT id FROM public.rumah WHERE rt_id IN (
    SELECT rt_id FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin'
  )
));

CREATE POLICY "Warga can view own tagihan"
ON public.tagihan FOR SELECT
USING (rumah_id IN (SELECT id FROM public.rumah WHERE user_id = auth.uid()));

-- Update RLS Policies for notifications table
DROP POLICY IF EXISTS "Admin can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Warga can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Warga can view own notifications" ON public.notifications;

CREATE POLICY "Super admin can manage all notifications"
ON public.notifications FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin can manage notifications in own RT"
ON public.notifications FOR ALL
USING (rumah_id IN (
  SELECT id FROM public.rumah WHERE rt_id IN (
    SELECT rt_id FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin'
  )
));

CREATE POLICY "Warga can view own notifications"
ON public.notifications FOR SELECT
USING (rumah_id IN (SELECT id FROM public.rumah WHERE user_id = auth.uid()));

CREATE POLICY "Warga can update own notifications"
ON public.notifications FOR UPDATE
USING (rumah_id IN (SELECT id FROM public.rumah WHERE user_id = auth.uid()));

-- Update RLS Policies for user_roles table
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Super admin can manage all roles"
ON public.user_roles FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin can view roles in own RT"
ON public.user_roles FOR SELECT
USING (rt_id IN (SELECT ur.rt_id FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text = 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Add trigger for updated_at on rt table
CREATE TRIGGER update_rt_updated_at
BEFORE UPDATE ON public.rt
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();