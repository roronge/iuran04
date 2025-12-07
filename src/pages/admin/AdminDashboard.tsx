import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/format';
import { Loader2, MapPin } from 'lucide-react';
import { useAdminRT } from '@/hooks/useAdminRT';

interface DashboardStats {
  totalRumah: number;
  totalKategori: number;
  tagihanBulanIni: number;
  terbayarBulanIni: number;
  saldoKas: number;
}

export default function AdminDashboard() {
  const { rtId, rtInfo, loading: rtLoading } = useAdminRT();
  const [stats, setStats] = useState<DashboardStats>({
    totalRumah: 0,
    totalKategori: 0,
    tagihanBulanIni: 0,
    terbayarBulanIni: 0,
    saldoKas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rtId) {
      fetchStats();
    }
  }, [rtId]);

  const fetchStats = async () => {
    try {
      const currentMonth = getCurrentMonth();
      const currentYear = getCurrentYear();

      // Fetch all stats in parallel - filtered by RT
      const [rumahRes, kategoriRes, tagihanRes, kasRes] = await Promise.all([
        supabase.from('rumah').select('id', { count: 'exact' }).eq('status', 'aktif').eq('rt_id', rtId),
        supabase.from('kategori_iuran').select('id', { count: 'exact' }).eq('rt_id', rtId),
        supabase
          .from('tagihan')
          .select('nominal, status, rumah!inner(rt_id)')
          .eq('bulan', currentMonth)
          .eq('tahun', currentYear)
          .eq('rumah.rt_id', rtId),
        supabase.from('buku_kas').select('nominal, jenis').eq('rt_id', rtId),
      ]);

      const totalRumah = rumahRes.count || 0;
      const totalKategori = kategoriRes.count || 0;

      const tagihanData = tagihanRes.data || [];
      const tagihanBulanIni = tagihanData.reduce((sum, t) => sum + (t.nominal || 0), 0);
      const terbayarBulanIni = tagihanData
        .filter((t) => t.status === 'lunas')
        .reduce((sum, t) => sum + (t.nominal || 0), 0);

      const kasData = kasRes.data || [];
      const saldoKas = kasData.reduce((sum, k) => {
        return k.jenis === 'masuk' ? sum + (k.nominal || 0) : sum - (k.nominal || 0);
      }, 0);

      setStats({
        totalRumah,
        totalKategori,
        tagihanBulanIni,
        terbayarBulanIni,
        saldoKas,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || rtLoading) {
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Dashboard Admin</h1>
            {rtInfo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <MapPin className="h-3.5 w-3.5" />
                {rtInfo.nama}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Ringkasan kondisi iuran & kas {rtInfo?.nama || 'RT'} bulan {getMonthName(getCurrentMonth())} {getCurrentYear()}.
          </p>
          {rtInfo?.alamat && (
            <p className="text-xs text-muted-foreground mt-1">{rtInfo.alamat}</p>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Rumah Aktif"
            value={stats.totalRumah}
            variant="default"
          />
          <StatCard
            title="Kategori Iuran"
            value={stats.totalKategori}
            variant="teal"
          />
          <StatCard
            title="Tagihan Bulan Ini"
            value={formatCurrency(stats.tagihanBulanIni)}
            subtitle={`Terbayar: ${formatCurrency(stats.terbayarBulanIni)}`}
            variant="yellow"
          />
          <StatCard
            title="Saldo Kas RT"
            value={formatCurrency(stats.saldoKas)}
            variant="cyan"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips Penggunaan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Isi data rumah terlebih dahulu.</li>
              <li>Buat kategori iuran (kebersihan, keamanan, kas bersama, dll).</li>
              <li>Generate tagihan bulanan setelah semua data siap.</li>
              <li>Catat setiap pembayaran masuk agar kas RT selalu up-to-date.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
