import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/format';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Download } from 'lucide-react';

interface LaporanItem {
  rumah_id: string;
  blok: string | null;
  no_rumah: string;
  kepala_keluarga: string;
  totalTagihan: number;
  totalBayar: number;
  totalSisa: number;
}

export default function LaporanIuranPage() {
  const [laporanList, setLaporanList] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulan, setBulan] = useState(getCurrentMonth().toString());
  const [tahun, setTahun] = useState(getCurrentYear().toString());
  const [totals, setTotals] = useState({ tagihan: 0, bayar: 0, sisa: 0 });

  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tagihan')
        .select(`
          rumah_id,
          nominal,
          status,
          rumah (blok, no_rumah, kepala_keluarga)
        `)
        .eq('bulan', parseInt(bulan))
        .eq('tahun', parseInt(tahun));

      if (error) throw error;

      // Group by rumah
      const groupMap = new Map<string, LaporanItem>();

      (data || []).forEach((item: any) => {
        const rumahId = item.rumah_id;
        if (!groupMap.has(rumahId)) {
          groupMap.set(rumahId, {
            rumah_id: rumahId,
            blok: item.rumah?.blok,
            no_rumah: item.rumah?.no_rumah || '',
            kepala_keluarga: item.rumah?.kepala_keluarga || '',
            totalTagihan: 0,
            totalBayar: 0,
            totalSisa: 0,
          });
        }

        const group = groupMap.get(rumahId)!;
        group.totalTagihan += item.nominal;
        if (item.status === 'lunas') {
          group.totalBayar += item.nominal;
        }
      });

      // Calculate sisa
      let totalTagihan = 0;
      let totalBayar = 0;

      groupMap.forEach((group) => {
        group.totalSisa = group.totalTagihan - group.totalBayar;
        totalTagihan += group.totalTagihan;
        totalBayar += group.totalBayar;
      });

      setLaporanList(Array.from(groupMap.values()));
      setTotals({
        tagihan: totalTagihan,
        bayar: totalBayar,
        sisa: totalTagihan - totalBayar,
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Rumah', 'Kepala Keluarga', 'Total Tagihan', 'Total Bayar', 'Sisa'];
    const rows = laporanList.map((item) => [
      `${item.blok || ''} ${item.no_rumah}`,
      item.kepala_keluarga,
      item.totalTagihan,
      item.totalBayar,
      item.totalSisa,
    ]);

    const csv = [
      `Laporan Iuran RT - ${getMonthName(parseInt(bulan))} ${tahun}`,
      '',
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      `Total Tagihan,${totals.tagihan}`,
      `Total Bayar,${totals.bayar}`,
      `Total Sisa,${totals.sisa}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-iuran-${bulan}-${tahun}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Laporan berhasil diexport');
  };

  if (loading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Laporan Iuran Bulanan</h1>
            <p className="text-muted-foreground">
              Rekap iuran per rumah untuk periode {getMonthName(parseInt(bulan))} {tahun}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="w-20"
              min="1"
              max="12"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
            />
            <Input
              type="number"
              className="w-24"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
            />
            <Button onClick={fetchLaporan}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Tampilkan
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Tagihan"
            value={formatCurrency(totals.tagihan)}
            variant="yellow"
          />
          <StatCard
            title="Total Bayar"
            value={formatCurrency(totals.bayar)}
            variant="teal"
          />
          <StatCard
            title="Total Sisa"
            value={formatCurrency(totals.sisa)}
            variant="pink"
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            {laporanList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada data laporan. Silakan pilih bulan & tahun lalu klik Tampilkan.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rumah</TableHead>
                      <TableHead>Kepala Keluarga</TableHead>
                      <TableHead className="text-right">Total Tagihan</TableHead>
                      <TableHead className="text-right">Total Bayar</TableHead>
                      <TableHead className="text-right">Sisa</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laporanList.map((item) => (
                      <TableRow key={item.rumah_id}>
                        <TableCell className="font-medium">
                          {item.blok} {item.no_rumah}
                        </TableCell>
                        <TableCell>{item.kepala_keluarga}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totalTagihan)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totalBayar)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totalSisa)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.totalSisa === 0 ? 'default' : 'destructive'}
                            className={item.totalSisa === 0 ? 'bg-success' : ''}
                          >
                            {item.totalSisa === 0 ? 'LUNAS' : 'BELUM'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
