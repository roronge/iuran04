-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'warga');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'warga',
  UNIQUE (user_id, role)
);

-- Create rumah (houses) table
CREATE TABLE public.rumah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blok TEXT,
  no_rumah TEXT NOT NULL,
  kepala_keluarga TEXT NOT NULL,
  no_hp TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'non-aktif')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kategori_iuran table
CREATE TABLE public.kategori_iuran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  nominal BIGINT NOT NULL DEFAULT 0,
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tagihan table
CREATE TABLE public.tagihan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rumah_id UUID REFERENCES public.rumah(id) ON DELETE CASCADE NOT NULL,
  kategori_id UUID REFERENCES public.kategori_iuran(id) ON DELETE CASCADE NOT NULL,
  bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
  tahun INTEGER NOT NULL,
  nominal BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'belum' CHECK (status IN ('belum', 'lunas')),
  tanggal_bayar TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (rumah_id, kategori_id, bulan, tahun)
);

-- Create buku_kas table
CREATE TABLE public.buku_kas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  nominal BIGINT NOT NULL,
  tagihan_id UUID REFERENCES public.tagihan(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rumah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_iuran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buku_kas ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's rumah_id
CREATE OR REPLACE FUNCTION public.get_user_rumah_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.rumah WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Rumah policies
CREATE POLICY "Admin can manage all rumah" ON public.rumah
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Warga can view own rumah" ON public.rumah
  FOR SELECT USING (user_id = auth.uid());

-- Kategori iuran policies
CREATE POLICY "Everyone can view kategori" ON public.kategori_iuran
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage kategori" ON public.kategori_iuran
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tagihan policies
CREATE POLICY "Admin can manage all tagihan" ON public.tagihan
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Warga can view own tagihan" ON public.tagihan
  FOR SELECT USING (
    rumah_id IN (SELECT id FROM public.rumah WHERE user_id = auth.uid())
  );

-- Buku kas policies (admin only)
CREATE POLICY "Admin can manage buku kas" ON public.buku_kas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rumah_updated_at
  BEFORE UPDATE ON public.rumah
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default role as warga
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'warga');
  
  -- Link to rumah if email matches
  UPDATE public.rumah
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();