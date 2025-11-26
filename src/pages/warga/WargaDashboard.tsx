import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/format';
import { Loader2, Receipt, CheckCircle, AlertCircle } from 'lucide-react';

interface Tagihan {
  id: string;
  bulan: number;
  tahun: number;
  nominal: number;
  status: string;
  kategori_iuran: {
    nama: string;
  } | null;
}

interface RumahInfo {
  blok: string | null;
  no_rumah: string;
  kepala_keluarga: string;
}

export default function WargaDashboard() {
  const { user } = useAuth();
  const [rumahInfo, setRumahInfo] = useState<RumahInfo | null>(null);
  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch rumah info
      const { data: rumahData } = await supabase
        .from('rumah')
        .select('id, blok, no_rumah, kepala_keluarga')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (rumahData) {
        setRumahInfo(rumahData);

        // Fetch tagihan for this month
        const currentMonth = getCurrentMonth();
        const currentYear = getCurrentYear();

        const { data: tagihanData } = await supabase
          .from('tagihan')
          .select(`
            id,
            bulan,
            tahun,
            nominal,
            status,
            kategori_iuran (nama)
          `)
          .eq('rumah_id', rumahData.id)
          .eq('bulan', currentMonth)
          .eq('tahun', currentYear);

        setTagihan(tagihanData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

  if (!rumahInfo) {
    return (
      <AppLayout>
        <Card className="border-warning bg-warning-light">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-warning" />
              <div>
                <h3 className="font-semibold">Akun Belum Terhubung</h3>
                <p className="text-sm text-muted-foreground">
                  Email Anda belum terdaftar di data rumah RT. Hubungi admin untuk menambahkan data Anda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const totalTagihan = tagihan.reduce((sum, t) => sum + t.nominal, 0);
  const totalTerbayar = tagihan.filter(t => t.status === 'lunas').reduce((sum, t) => sum + t.nominal, 0);
  const totalBelumBayar = totalTagihan - totalTerbayar;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Warga</h1>
          <p className="text-muted-foreground">
            {rumahInfo.blok} {rumahInfo.no_rumah} - {rumahInfo.kepala_keluarga}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Tagihan"
            value={formatCurrency(totalTagihan)}
            subtitle={`${getMonthName(getCurrentMonth())} ${getCurrentYear()}`}
            variant="yellow"
          />
          <StatCard
            title="Sudah Dibayar"
            value={formatCurrency(totalTerbayar)}
            variant="teal"
          />
          <StatCard
            title="Belum Dibayar"
            value={formatCurrency(totalBelumBayar)}
            variant="pink"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Tagihan Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tagihan.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Belum ada tagihan untuk bulan ini.
              </p>
            ) : (
              <div className="space-y-3">
                {tagihan.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{item.kategori_iuran?.nama}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.nominal)}
                      </p>
                    </div>
                    <Badge
                      variant={item.status === 'lunas' ? 'default' : 'destructive'}
                      className={item.status === 'lunas' ? 'bg-success' : ''}
                    >
                      {item.status === 'lunas' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Lunas</>
                      ) : (
                        'Belum Bayar'
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
