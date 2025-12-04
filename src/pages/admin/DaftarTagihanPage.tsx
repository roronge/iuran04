import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/format';
import { toast } from 'sonner';
import { Loader2, Eye, Trash2, RefreshCw, CheckCircle, Printer } from 'lucide-react';
import { SendNotificationDialog } from '@/components/notifications/SendNotificationDialog';
import { PaymentReceipt, ReceiptData } from '@/components/receipt/PaymentReceipt';

interface TagihanGroup {
  rumah_id: string;
  blok: string | null;
  no_rumah: string;
  kepala_keluarga: string;
  email: string | null;
  totalTagihan: number;
  totalBayar: number;
  status: 'belum' | 'lunas' | 'sebagian';
  items: TagihanItem[];
}

interface TagihanItem {
  id: string;
  kategori_nama: string;
  kategori_id: string;
  nominal: number;
  status: string;
  bulan: number;
  tahun: number;
}

export default function DaftarTagihanPage() {
  const [tagihanGroups, setTagihanGroups] = useState<TagihanGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulan, setBulan] = useState(getCurrentMonth().toString());
  const [tahun, setTahun] = useState(getCurrentYear().toString());
  const [selectedGroup, setSelectedGroup] = useState<TagihanGroup | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRumahIds, setSelectedRumahIds] = useState<Set<string>>(new Set());
  const [confirmPayment, setConfirmPayment] = useState<{ type: 'single' | 'all'; tagihanId?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchTagihan();
  }, []);

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tagihan')
        .select(`
          id,
          rumah_id,
          nominal,
          status,
          bulan,
          tahun,
          kategori_id,
          rumah (blok, no_rumah, kepala_keluarga, email),
          kategori_iuran (id, nama)
        `)
        .eq('bulan', parseInt(bulan))
        .eq('tahun', parseInt(tahun));

      if (error) throw error;

      // Group by rumah
      const groupMap = new Map<string, TagihanGroup>();

      (data || []).forEach((item: any) => {
        const rumahId = item.rumah_id;
        if (!groupMap.has(rumahId)) {
          groupMap.set(rumahId, {
            rumah_id: rumahId,
            blok: item.rumah?.blok,
            no_rumah: item.rumah?.no_rumah || '',
            kepala_keluarga: item.rumah?.kepala_keluarga || '',
            email: item.rumah?.email || null,
            totalTagihan: 0,
            totalBayar: 0,
            status: 'belum',
            items: [],
          });
        }

        const group = groupMap.get(rumahId)!;
        group.totalTagihan += item.nominal;
        if (item.status === 'lunas') {
          group.totalBayar += item.nominal;
        }
        group.items.push({
          id: item.id,
          kategori_nama: item.kategori_iuran?.nama || '',
          kategori_id: item.kategori_id,
          nominal: item.nominal,
          status: item.status,
          bulan: item.bulan,
          tahun: item.tahun,
        });
      });

      // Calculate status
      groupMap.forEach((group) => {
        if (group.totalBayar === 0) {
          group.status = 'belum';
        } else if (group.totalBayar >= group.totalTagihan) {
          group.status = 'lunas';
        } else {
          group.status = 'sebagian';
        }
      });

      setTagihanGroups(Array.from(groupMap.values()));
      setSelectedRumahIds(new Set());
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data tagihan');
    } finally {
      setLoading(false);
    }
  };

  const handleBayar = async (tagihanId: string) => {
    setIsProcessing(true);
    try {
      const { data: tagihan, error: fetchError } = await supabase
        .from('tagihan')
        .select('nominal, rumah_id, bulan, tahun, kategori_iuran(nama), rumah(kepala_keluarga, blok, no_rumah)')
        .eq('id', tagihanId)
        .single();

      if (fetchError) throw fetchError;

      const tanggalBayar = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('tagihan')
        .update({ status: 'lunas', tanggal_bayar: tanggalBayar })
        .eq('id', tagihanId);

      if (updateError) throw updateError;

      const { error: kasError } = await supabase.from('buku_kas').insert({
        keterangan: `Pembayaran ${(tagihan as any).kategori_iuran?.nama} - ${(tagihan as any).rumah?.kepala_keluarga}`,
        jenis: 'masuk',
        nominal: tagihan.nominal,
        tagihan_id: tagihanId,
      });

      if (kasError) throw kasError;

      toast.success('Pembayaran berhasil dicatat');

      // Show receipt
      setReceiptData({
        id: tagihanId,
        kepala_keluarga: (tagihan as any).rumah?.kepala_keluarga || '',
        alamat: `${(tagihan as any).rumah?.blok || ''} ${(tagihan as any).rumah?.no_rumah || ''}`.trim(),
        items: [{ kategori: (tagihan as any).kategori_iuran?.nama || '', nominal: tagihan.nominal }],
        total: tagihan.nominal,
        bulan: tagihan.bulan,
        tahun: tagihan.tahun,
        tanggal_bayar: tanggalBayar,
      });
      setIsReceiptOpen(true);

      if (selectedGroup) {
        const updatedItems = selectedGroup.items.map(item =>
          item.id === tagihanId ? { ...item, status: 'lunas' } : item
        );
        const updatedBayar = updatedItems
          .filter(i => i.status === 'lunas')
          .reduce((sum, i) => sum + i.nominal, 0);
        
        setSelectedGroup({
          ...selectedGroup,
          items: updatedItems,
          totalBayar: updatedBayar,
          status: updatedBayar >= selectedGroup.totalTagihan ? 'lunas' : updatedBayar > 0 ? 'sebagian' : 'belum',
        });
      }

      fetchTagihan();
    } catch (error: any) {
      toast.error('Gagal memproses pembayaran', { description: error.message });
    } finally {
      setIsProcessing(false);
      setConfirmPayment(null);
    }
  };

  const handleBayarSemua = async () => {
    if (!selectedGroup) return;
    
    const belumLunas = selectedGroup.items.filter(item => item.status !== 'lunas');
    if (belumLunas.length === 0) return;

    setIsProcessing(true);
    const tanggalBayar = new Date().toISOString();
    
    try {
      for (const item of belumLunas) {
        const { error: updateError } = await supabase
          .from('tagihan')
          .update({ status: 'lunas', tanggal_bayar: tanggalBayar })
          .eq('id', item.id);

        if (updateError) throw updateError;

        const { error: kasError } = await supabase.from('buku_kas').insert({
          keterangan: `Pembayaran ${item.kategori_nama} - ${selectedGroup.kepala_keluarga}`,
          jenis: 'masuk',
          nominal: item.nominal,
          tagihan_id: item.id,
        });

        if (kasError) throw kasError;
      }

      toast.success(`${belumLunas.length} tagihan berhasil dibayar`);

      // Show receipt for all payments
      setReceiptData({
        id: belumLunas[0].id,
        kepala_keluarga: selectedGroup.kepala_keluarga,
        alamat: `${selectedGroup.blok || ''} ${selectedGroup.no_rumah}`.trim(),
        items: belumLunas.map(item => ({ kategori: item.kategori_nama, nominal: item.nominal })),
        total: belumLunas.reduce((sum, item) => sum + item.nominal, 0),
        bulan: parseInt(bulan),
        tahun: parseInt(tahun),
        tanggal_bayar: tanggalBayar,
      });
      setIsReceiptOpen(true);

      const updatedItems = selectedGroup.items.map(item => ({ ...item, status: 'lunas' }));
      setSelectedGroup({
        ...selectedGroup,
        items: updatedItems,
        totalBayar: selectedGroup.totalTagihan,
        status: 'lunas',
      });

      fetchTagihan();
    } catch (error: any) {
      toast.error('Gagal memproses pembayaran', { description: error.message });
    } finally {
      setIsProcessing(false);
      setConfirmPayment(null);
    }
  };

  const confirmAndPay = () => {
    if (confirmPayment?.type === 'single' && confirmPayment.tagihanId) {
      handleBayar(confirmPayment.tagihanId);
    } else if (confirmPayment?.type === 'all') {
      handleBayarSemua();
    }
  };

  const handleViewReceipt = async (item: TagihanItem) => {
    if (!selectedGroup) return;
    
    const { data: tagihan } = await supabase
      .from('tagihan')
      .select('tanggal_bayar')
      .eq('id', item.id)
      .single();

    setReceiptData({
      id: item.id,
      kepala_keluarga: selectedGroup.kepala_keluarga,
      alamat: `${selectedGroup.blok || ''} ${selectedGroup.no_rumah}`.trim(),
      items: [{ kategori: item.kategori_nama, nominal: item.nominal }],
      total: item.nominal,
      bulan: item.bulan,
      tahun: item.tahun,
      tanggal_bayar: tagihan?.tanggal_bayar || new Date().toISOString(),
    });
    setIsReceiptOpen(true);
  };

  const handleDelete = async (tagihanId: string) => {
    if (!confirm('Yakin ingin menghapus tagihan ini?')) return;

    try {
      const { error } = await supabase.from('tagihan').delete().eq('id', tagihanId);
      if (error) throw error;
      toast.success('Tagihan berhasil dihapus');
      fetchTagihan();
    } catch (error: any) {
      toast.error('Gagal menghapus tagihan', { description: error.message });
    }
  };

  const toggleSelectRumah = (rumahId: string) => {
    const newSet = new Set(selectedRumahIds);
    if (newSet.has(rumahId)) {
      newSet.delete(rumahId);
    } else {
      newSet.add(rumahId);
    }
    setSelectedRumahIds(newSet);
  };

  const toggleSelectAll = () => {
    const belumLunasGroups = tagihanGroups.filter(g => g.status !== 'lunas');
    if (selectedRumahIds.size === belumLunasGroups.length) {
      setSelectedRumahIds(new Set());
    } else {
      setSelectedRumahIds(new Set(belumLunasGroups.map(g => g.rumah_id)));
    }
  };

  const getSelectedTagihan = () => {
    const result: any[] = [];
    tagihanGroups
      .filter(g => selectedRumahIds.has(g.rumah_id))
      .forEach(group => {
        group.items
          .filter(item => item.status !== 'lunas')
          .forEach(item => {
            result.push({
              id: item.id,
              rumah_id: group.rumah_id,
              nominal: item.nominal,
              bulan: item.bulan,
              tahun: item.tahun,
              rumah: {
                kepala_keluarga: group.kepala_keluarga,
                no_rumah: group.no_rumah,
                blok: group.blok,
                email: group.email,
              },
              kategori_iuran: {
                nama: item.kategori_nama,
              },
            });
          });
      });
    return result;
  };

  const totalTagihan = tagihanGroups.reduce((sum, g) => sum + g.totalTagihan, 0);
  const totalBayar = tagihanGroups.reduce((sum, g) => sum + g.totalBayar, 0);
  const belumLunasCount = tagihanGroups.filter(g => g.status !== 'lunas').length;

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
            <h1 className="text-2xl font-bold">Daftar Tagihan</h1>
            <p className="text-muted-foreground">
              Lihat status pembayaran iuran per rumah untuk bulan tertentu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <Button onClick={fetchTagihan}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Total Tagihan"
            value={formatCurrency(totalTagihan)}
            variant="yellow"
          />
          <StatCard
            title="Total Terbayar"
            value={formatCurrency(totalBayar)}
            variant="teal"
          />
        </div>

        {/* Notification Actions */}
        <div className="flex items-center gap-4">
          <SendNotificationDialog 
            selectedTagihan={getSelectedTagihan()} 
            onSuccess={fetchTagihan}
          />
          <span className="text-sm text-muted-foreground">
            {selectedRumahIds.size > 0 
              ? `${selectedRumahIds.size} rumah dipilih`
              : `Pilih rumah yang belum lunas untuk kirim notifikasi`
            }
          </span>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRumahIds.size === belumLunasCount && belumLunasCount > 0}
                        onCheckedChange={toggleSelectAll}
                        disabled={belumLunasCount === 0}
                      />
                    </TableHead>
                    <TableHead>Rumah</TableHead>
                    <TableHead>KK</TableHead>
                    <TableHead>Total Tagihan</TableHead>
                    <TableHead>Total Bayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tagihanGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Belum ada tagihan untuk periode ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tagihanGroups.map((group) => (
                      <TableRow key={group.rumah_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRumahIds.has(group.rumah_id)}
                            onCheckedChange={() => toggleSelectRumah(group.rumah_id)}
                            disabled={group.status === 'lunas'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {group.blok} {group.no_rumah}
                        </TableCell>
                        <TableCell>{group.kepala_keluarga}</TableCell>
                        <TableCell>{formatCurrency(group.totalTagihan)}</TableCell>
                        <TableCell>{formatCurrency(group.totalBayar)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={group.status === 'lunas' ? 'default' : 'destructive'}
                            className={group.status === 'lunas' ? 'bg-success' : group.status === 'sebagian' ? 'bg-warning' : ''}
                          >
                            {group.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(group);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Detail Tagihan - {selectedGroup?.blok} {selectedGroup?.no_rumah}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedGroup?.kepala_keluarga} • {getMonthName(parseInt(bulan))} {tahun}
              </p>
              {selectedGroup && selectedGroup.items.some(i => i.status !== 'lunas') && (
                <Button
                  size="sm"
                  onClick={() => setConfirmPayment({ type: 'all' })}
                  disabled={isProcessing}
                >
                  Bayar Semua
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {selectedGroup?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{item.kategori_nama}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.nominal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'lunas' ? (
                      <div className="flex items-center gap-2">
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
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setConfirmPayment({ type: 'single', tagihanId: item.id })}
                          disabled={isProcessing}
                        >
                          Bayar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmPayment} onOpenChange={(open) => !open && setConfirmPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPayment?.type === 'all'
                ? `Apakah Anda yakin ingin membayar semua tagihan (${selectedGroup?.items.filter(i => i.status !== 'lunas').length} item) untuk ${selectedGroup?.kepala_keluarga}?`
                : 'Apakah Anda yakin ingin memproses pembayaran ini?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndPay} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ya, Bayar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PaymentReceipt
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={receiptData}
      />
    </AppLayout>
  );
}
