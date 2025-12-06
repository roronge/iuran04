-- Create RT (Rukun Tetangga) table
CREATE TABLE public.rt (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  alamat TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rt table
ALTER TABLE public.rt ENABLE ROW LEVEL SECURITY;

-- Add rt_id to rumah table
ALTER TABLE public.rumah ADD COLUMN rt_id UUID REFERENCES public.rt(id);

-- Add rt_id to kategori_iuran table
ALTER TABLE public.kategori_iuran ADD COLUMN rt_id UUID REFERENCES public.rt(id);

-- Add rt_id to buku_kas table
ALTER TABLE public.buku_kas ADD COLUMN rt_id UUID REFERENCES public.rt(id);

-- Add rt_id to user_roles table for admin assignment
ALTER TABLE public.user_roles ADD COLUMN rt_id UUID REFERENCES public.rt(id);

-- Add super_admin role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';