import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/format';
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';
import { useAdminRT } from '@/hooks/useAdminRT';

export default function GenerateTagihanPage() {
  const { rtId, loading: rtLoading } = useAdminRT();
  const [bulan, setBulan] = useState(getCurrentMonth().toString());
  const [tahun, setTahun] = useState(getCurrentYear().toString());
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!rtId) {
      toast.error('RT tidak ditemukan');
      return;
    }

    const bulanNum = parseInt(bulan);
    const tahunNum = parseInt(tahun);

    if (bulanNum < 1 || bulanNum > 12) {
      toast.error('Bulan tidak valid');
      return;
    }

    setLoading(true);

    try {
      // Get all active rumah in this RT
      const { data: rumahList, error: rumahError } = await supabase
        .from('rumah')
        .select('id')
        .eq('status', 'aktif')
        .eq('rt_id', rtId);

      if (rumahError) throw rumahError;

      // Get all kategori in this RT
      const { data: kategoriList, error: kategoriError } = await supabase
        .from('kategori_iuran')
        .select('id, nominal')
        .eq('rt_id', rtId);

      if (kategoriError) throw kategoriError;

      if (!rumahList?.length) {
        toast.error('Tidak ada rumah aktif');
        setLoading(false);
        return;
      }

      if (!kategoriList?.length) {
        toast.error('Tidak ada kategori iuran');
        setLoading(false);
        return;
      }

      // Create tagihan for each combination
      const tagihanToInsert = [];
      for (const rumah of rumahList) {
        for (const kategori of kategoriList) {
          tagihanToInsert.push({
            rumah_id: rumah.id,
            kategori_id: kategori.id,
            bulan: bulanNum,
            tahun: tahunNum,
            nominal: kategori.nominal,
            status: 'belum',
          });
        }
      }

      // Insert with upsert to avoid duplicates
      const { error: insertError } = await supabase
        .from('tagihan')
        .upsert(tagihanToInsert, {
          onConflict: 'rumah_id,kategori_id,bulan,tahun',
          ignoreDuplicates: true,
        });

      if (insertError) throw insertError;

      toast.success('Tagihan berhasil digenerate!', {
        description: `${tagihanToInsert.length} tagihan untuk ${getMonthName(bulanNum)} ${tahunNum}`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Gagal generate tagihan', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (rtLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Generate Tagihan Bulanan</h1>
          <p className="text-muted-foreground">
            Pilih bulan dan tahun untuk membuat tagihan otomatis ke semua rumah aktif.
          </p>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Buat Tagihan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bulan</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                />
              </div>
              <div>
                <Label>Tahun</Label>
                <Input
                  type="number"
                  min="2020"
                  max="2100"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Generate Tagihan
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Tagihan akan dibuat untuk semua rumah aktif berdasarkan kategori iuran yang ada.
              Tagihan yang sudah ada tidak akan ditimpa.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
