import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

interface TagihanInfo {
  id: string;
  rumah_id: string;
  nominal: number;
  bulan: number;
  tahun: number;
  rumah?: {
    kepala_keluarga: string;
    no_rumah: string;
    blok: string | null;
    email: string | null;
  };
  kategori_iuran?: {
    nama: string;
  };
}

interface SendNotificationDialogProps {
  selectedTagihan: TagihanInfo[];
  onSuccess?: () => void;
}

const BULAN_NAMES = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function SendNotificationDialog({ selectedTagihan, onSuccess }: SendNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [judul, setJudul] = useState("Pemberitahuan Tagihan Iuran");
  const [pesan, setPesan] = useState("");

  const generateDefaultMessage = () => {
    if (selectedTagihan.length === 1) {
      const t = selectedTagihan[0];
      return `Dengan hormat,\n\nKami mengingatkan bahwa tagihan iuran ${t.kategori_iuran?.nama || "bulanan"} untuk periode ${BULAN_NAMES[t.bulan]} ${t.tahun} sebesar ${formatCurrency(t.nominal)} belum dibayarkan.\n\nMohon segera melakukan pembayaran. Terima kasih.`;
    }
    return `Dengan hormat,\n\nKami mengingatkan bahwa Anda memiliki tagihan iuran yang belum dibayarkan.\n\nMohon segera melakukan pembayaran. Terima kasih.`;
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPesan(generateDefaultMessage());
    }
  };

  const handleSend = async () => {
    if (!judul.trim() || !pesan.trim()) {
      toast({
        title: "Error",
        description: "Judul dan pesan harus diisi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const rumah_ids = [...new Set(selectedTagihan.map((t) => t.rumah_id))];
      const tagihan_id = selectedTagihan.length === 1 ? selectedTagihan[0].id : undefined;

      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: {
          rumah_ids,
          tagihan_id,
          judul,
          pesan,
          jenis: "tagihan",
          send_email: sendEmail,
        },
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Notifikasi terkirim ke ${data.notifications_created} warga${sendEmail ? `, ${data.emails_sent} email terkirim` : ""}`,
      });

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim notifikasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const emailCount = selectedTagihan.filter((t) => t.rumah?.email).length;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={selectedTagihan.length === 0}>
          <Send className="h-4 w-4 mr-2" />
          Kirim Notifikasi ({selectedTagihan.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kirim Notifikasi</DialogTitle>
          <DialogDescription>
            Kirim notifikasi ke {selectedTagihan.length} warga terpilih
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="judul">Judul</Label>
            <Input
              id="judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul notifikasi"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pesan">Pesan</Label>
            <Textarea
              id="pesan"
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              placeholder="Isi pesan notifikasi"
              rows={6}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label htmlFor="sendEmail" className="text-sm font-normal">
              Kirim juga via email ({emailCount} alamat tersedia)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Kirim Notifikasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
