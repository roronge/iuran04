-- Drop ALL existing problematic policies on user_roles
DROP POLICY IF EXISTS "Admin can view roles in own RT" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;

-- Also fix other tables that have recursive queries on user_roles

-- Fix buku_kas policies
DROP POLICY IF EXISTS "Admin can manage buku kas in own RT" ON public.buku_kas;
DROP POLICY IF EXISTS "Super admin can manage all buku kas" ON public.buku_kas;

CREATE POLICY "Super admin full access buku kas"
ON public.buku_kas
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin manage buku kas own RT"
ON public.buku_kas
FOR ALL
TO authenticated
USING (rt_id = public.get_user_rt_id(auth.uid()))
WITH CHECK (rt_id = public.get_user_rt_id(auth.uid()));

-- Fix kategori_iuran policies
DROP POLICY IF EXISTS "Admin can manage kategori in own RT" ON public.kategori_iuran;
DROP POLICY IF EXISTS "Super admin can manage all kategori" ON public.kategori_iuran;
DROP POLICY IF EXISTS "Warga can view kategori from own RT" ON public.kategori_iuran;

CREATE POLICY "Super admin full access kategori"
ON public.kategori_iuran
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin manage kategori own RT"
ON public.kategori_iuran
FOR ALL
TO authenticated
USING (rt_id = public.get_user_rt_id(auth.uid()))
WITH CHECK (rt_id = public.get_user_rt_id(auth.uid()));

CREATE POLICY "Warga view kategori own RT"
ON public.kategori_iuran
FOR SELECT
TO authenticated
USING (rt_id IN (SELECT r.rt_id FROM rumah r WHERE r.user_id = auth.uid()));

-- Fix rt policies
DROP POLICY IF EXISTS "Admin can view own RT" ON public.rt;
DROP POLICY IF EXISTS "Super admin can manage all RT" ON public.rt;

CREATE POLICY "Super admin full access RT"
ON public.rt
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin view own RT"
ON public.rt
FOR SELECT
TO authenticated
USING (id = public.get_user_rt_id(auth.uid()));

-- Fix rumah policies  
DROP POLICY IF EXISTS "Admin can manage rumah in own RT" ON public.rumah;
DROP POLICY IF EXISTS "Super admin can manage all rumah" ON public.rumah;
DROP POLICY IF EXISTS "Warga can view own rumah" ON public.rumah;

CREATE POLICY "Super admin full access rumah"
ON public.rumah
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin manage rumah own RT"
ON public.rumah
FOR ALL
TO authenticated
USING (rt_id = public.get_user_rt_id(auth.uid()))
WITH CHECK (rt_id = public.get_user_rt_id(auth.uid()));

CREATE POLICY "Warga view own rumah"
ON public.rumah
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Fix tagihan policies
DROP POLICY IF EXISTS "Admin can manage tagihan in own RT" ON public.tagihan;
DROP POLICY IF EXISTS "Super admin can manage all tagihan" ON public.tagihan;
DROP POLICY IF EXISTS "Warga can view own tagihan" ON public.tagihan;

CREATE POLICY "Super admin full access tagihan"
ON public.tagihan
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin manage tagihan own RT"
ON public.tagihan
FOR ALL
TO authenticated
USING (rumah_id IN (SELECT id FROM rumah WHERE rt_id = public.get_user_rt_id(auth.uid())))
WITH CHECK (rumah_id IN (SELECT id FROM rumah WHERE rt_id = public.get_user_rt_id(auth.uid())));

CREATE POLICY "Warga view own tagihan"
ON public.tagihan
FOR SELECT
TO authenticated
USING (rumah_id IN (SELECT id FROM rumah WHERE user_id = auth.uid()));

-- Fix notifications policies
DROP POLICY IF EXISTS "Admin can manage notifications in own RT" ON public.notifications;
DROP POLICY IF EXISTS "Super admin can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Warga can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Warga can update own notifications" ON public.notifications;

CREATE POLICY "Super admin full access notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin manage notifications own RT"
ON public.notifications
FOR ALL
TO authenticated
USING (rumah_id IN (SELECT id FROM rumah WHERE rt_id = public.get_user_rt_id(auth.uid())))
WITH CHECK (rumah_id IN (SELECT id FROM rumah WHERE rt_id = public.get_user_rt_id(auth.uid())));

CREATE POLICY "Warga view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (rumah_id IN (SELECT id FROM rumah WHERE user_id = auth.uid()));

CREATE POLICY "Warga update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (rumah_id IN (SELECT id FROM rumah WHERE user_id = auth.uid()));