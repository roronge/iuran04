import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthName } from '@/lib/format';
import { Loader2, Receipt, CheckCircle, AlertCircle, Calendar, Printer } from 'lucide-react';
import { PaymentReceipt, ReceiptData } from '@/components/receipt/PaymentReceipt';

interface Tagihan {
  id: string;
  bulan: number;
  tahun: number;
  nominal: number;
  status: string;
  tanggal_bayar: string | null;
  kategori_iuran: {
    nama: string;
  } | null;
}

interface RumahInfo {
  id: string;
  kepala_keluarga: string;
  blok: string | null;
  no_rumah: string;
}

export default function WargaTagihanPage() {
  const { user } = useAuth();
  const [tagihanList, setTagihanList] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [rumahInfo, setRumahInfo] = useState<RumahInfo | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRumahAndTagihan();
    }
  }, [user]);

  const fetchRumahAndTagihan = async () => {
    try {
      // Get rumah info
      const { data: rumahData } = await supabase
        .from('rumah')
        .select('id, kepala_keluarga, blok, no_rumah')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!rumahData) {
        setLoading(false);
        return;
      }

      setRumahInfo(rumahData);

      // Fetch all tagihan
      const { data: tagihanData } = await supabase
        .from('tagihan')
        .select(`
          id,
          bulan,
          tahun,
          nominal,
          status,
          tanggal_bayar,
          kategori_iuran (nama)
        `)
        .eq('rumah_id', rumahData.id)
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false });

      setTagihanList(tagihanData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = (item: Tagihan) => {
    if (!rumahInfo || !item.tanggal_bayar) return;
    
    setReceiptData({
      id: item.id,
      kepala_keluarga: rumahInfo.kepala_keluarga,
      alamat: `${rumahInfo.blok || ''} ${rumahInfo.no_rumah}`.trim(),
      items: [{ kategori: item.kategori_iuran?.nama || '', nominal: item.nominal }],
      total: item.nominal,
      bulan: item.bulan,
      tahun: item.tahun,
      tanggal_bayar: item.tanggal_bayar,
    });
    setIsReceiptOpen(true);
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

  // Group tagihan by month/year
  const groupedTagihan = tagihanList.reduce((acc, tagihan) => {
    const key = `${tagihan.tahun}-${tagihan.bulan}`;
    if (!acc[key]) {
      acc[key] = {
        bulan: tagihan.bulan,
        tahun: tagihan.tahun,
        items: [],
        total: 0,
        paid: 0,
      };
    }
    acc[key].items.push(tagihan);
    acc[key].total += tagihan.nominal;
    if (tagihan.status === 'lunas') {
      acc[key].paid += tagihan.nominal;
    }
    return acc;
  }, {} as Record<string, { bulan: number; tahun: number; items: Tagihan[]; total: number; paid: number }>);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tagihan Saya</h1>
          <p className="text-muted-foreground">
            Riwayat tagihan iuran RT Anda
          </p>
        </div>

        {Object.keys(groupedTagihan).length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada tagihan.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTagihan).map(([key, group]) => (
              <Card key={key} className="overflow-hidden">
                <CardHeader className="pb-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {getMonthName(group.bulan)} {group.tahun}
                    </CardTitle>
                    <Badge
                      variant={group.paid >= group.total ? 'default' : 'destructive'}
                      className={group.paid >= group.total ? 'bg-success' : ''}
                    >
                      {group.paid >= group.total ? 'LUNAS' : `Sisa ${formatCurrency(group.total - group.paid)}`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div>
                          <p className="font-medium">{item.kategori_iuran?.nama}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.nominal)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'lunas' ? (
                            <>
                              <Badge className="bg-success">
                                <CheckCircle className="h-3 w-3 mr-1" /> Lunas
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewReceipt(item)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge className="bg-destructive text-destructive-foreground">
                              Belum
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold">{formatCurrency(group.total)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PaymentReceipt
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={receiptData}
      />
    </AppLayout>
  );
}
