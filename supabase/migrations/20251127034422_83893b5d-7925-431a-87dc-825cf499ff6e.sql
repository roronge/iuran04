-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rumah_id UUID NOT NULL REFERENCES public.rumah(id) ON DELETE CASCADE,
  tagihan_id UUID REFERENCES public.tagihan(id) ON DELETE SET NULL,
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  jenis TEXT NOT NULL DEFAULT 'tagihan',
  dibaca BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin can manage all notifications
CREATE POLICY "Admin can manage all notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Warga can view own notifications
CREATE POLICY "Warga can view own notifications"
ON public.notifications
FOR SELECT
USING (rumah_id IN (SELECT id FROM public.rumah WHERE user_id = auth.uid()));

-- Warga can update own notifications (mark as read)
CREATE POLICY "Warga can update own notifications"
ON public.notifications
FOR UPDATE
USING (rumah_id IN (SELECT id FROM public.rumah WHERE user_id = auth.uid()));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;