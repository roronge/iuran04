import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/format';
import { toast } from 'sonner';
import { Loader2, Eye, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

interface TagihanGroup {
  rumah_id: string;
  blok: string | null;
  no_rumah: string;
  kepala_keluarga: string;
  totalTagihan: number;
  totalBayar: number;
  status: 'belum' | 'lunas' | 'sebagian';
  items: TagihanItem[];
}

interface TagihanItem {
  id: string;
  kategori_nama: string;
  nominal: number;
  status: string;
}

export default function DaftarTagihanPage() {
  const [tagihanGroups, setTagihanGroups] = useState<TagihanGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulan, setBulan] = useState(getCurrentMonth().toString());
  const [tahun, setTahun] = useState(getCurrentYear().toString());
  const [selectedGroup, setSelectedGroup] = useState<TagihanGroup | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
          rumah (blok, no_rumah, kepala_keluarga),
          kategori_iuran (nama)
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
          nominal: item.nominal,
          status: item.status,
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
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data tagihan');
    } finally {
      setLoading(false);
    }
  };

  const handleBayar = async (tagihanId: string) => {
    try {
      // Get tagihan info
      const { data: tagihan, error: fetchError } = await supabase
        .from('tagihan')
        .select('nominal, rumah_id, kategori_iuran(nama), rumah(kepala_keluarga)')
        .eq('id', tagihanId)
        .single();

      if (fetchError) throw fetchError;

      // Update tagihan status
      const { error: updateError } = await supabase
        .from('tagihan')
        .update({ status: 'lunas', tanggal_bayar: new Date().toISOString() })
        .eq('id', tagihanId);

      if (updateError) throw updateError;

      // Create buku kas entry
      const { error: kasError } = await supabase.from('buku_kas').insert({
        keterangan: `Pembayaran ${(tagihan as any).kategori_iuran?.nama} - ${(tagihan as any).rumah?.kepala_keluarga}`,
        jenis: 'masuk',
        nominal: tagihan.nominal,
        tagihan_id: tagihanId,
      });

      if (kasError) throw kasError;

      toast.success('Pembayaran berhasil dicatat');
      fetchTagihan();
      
      // Update selected group if dialog is open
      if (selectedGroup) {
        const updatedGroup = tagihanGroups.find(g => g.rumah_id === selectedGroup.rumah_id);
        if (updatedGroup) {
          setSelectedGroup(updatedGroup);
        }
      }
    } catch (error: any) {
      toast.error('Gagal memproses pembayaran', { description: error.message });
    }
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

  const totalTagihan = tagihanGroups.reduce((sum, g) => sum + g.totalTagihan, 0);
  const totalBayar = tagihanGroups.reduce((sum, g) => sum + g.totalBayar, 0);

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

        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada tagihan untuk periode ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tagihanGroups.map((group) => (
                      <TableRow key={group.rumah_id}>
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
            <p className="text-sm text-muted-foreground">
              {selectedGroup?.kepala_keluarga} • {getMonthName(parseInt(bulan))} {tahun}
            </p>
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
                      <Badge className="bg-success">
                        <CheckCircle className="h-3 w-3 mr-1" /> Lunas
                      </Badge>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleBayar(item.id)}
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
    </AppLayout>
  );
}
