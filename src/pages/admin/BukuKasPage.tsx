import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface BukuKas {
  id: string;
  tanggal: string;
  keterangan: string;
  jenis: string;
  nominal: number;
}

export default function BukuKasPage() {
  const [kasList, setKasList] = useState<BukuKas[]>([]);
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
    jenis: 'masuk',
    nominal: '',
  });

  useEffect(() => {
    fetchKas();
  }, []);

  const fetchKas = async () => {
    try {
      const { data, error } = await supabase
        .from('buku_kas')
        .select('*')
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const kasData = data || [];
      setKasList(kasData);

      // Calculate saldo
      const total = kasData.reduce((sum, k) => {
        return k.jenis === 'masuk' ? sum + k.nominal : sum - k.nominal;
      }, 0);
      setSaldo(total);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data kas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('buku_kas').insert({
        tanggal: formData.tanggal,
        keterangan: formData.keterangan,
        jenis: formData.jenis,
        nominal: parseInt(formData.nominal) || 0,
      });

      if (error) throw error;

      toast.success('Transaksi berhasil ditambahkan');
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: '',
        jenis: 'masuk',
        nominal: '',
      });
      fetchKas();
    } catch (error: any) {
      toast.error('Gagal menambah transaksi', { description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

    try {
      const { error } = await supabase.from('buku_kas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Transaksi berhasil dihapus');
      fetchKas();
    } catch (error: any) {
      toast.error('Gagal menghapus transaksi', { description: error.message });
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Buku Kas RT</h1>
          <p className="text-muted-foreground">
            Ringkasan saldo kas RT berdasarkan seluruh pemasukan dan pengeluaran yang tercatat.
          </p>
        </div>

        <Card className="bg-teal-light border-teal/20">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-teal-dark">Saldo saat ini:</p>
            <p className="text-3xl font-bold text-teal-dark">{formatCurrency(saldo)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Tambah Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Keterangan</Label>
                <Input
                  placeholder="Deskripsi transaksi"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Jenis</Label>
                <Select
                  value={formData.jenis}
                  onValueChange={(value) => setFormData({ ...formData, jenis: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masuk">Pemasukan</SelectItem>
                    <SelectItem value="keluar">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nominal</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-5 flex justify-end">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kasList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Belum ada data kas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kasList.map((kas) => (
                      <TableRow key={kas.id}>
                        <TableCell>{formatDate(kas.tanggal)}</TableCell>
                        <TableCell>{kas.keterangan}</TableCell>
                        <TableCell>
                          <Badge
                            variant={kas.jenis === 'masuk' ? 'default' : 'destructive'}
                            className={kas.jenis === 'masuk' ? 'bg-success' : ''}
                          >
                            {kas.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={kas.jenis === 'masuk' ? 'text-success' : 'text-destructive'}>
                            {kas.jenis === 'masuk' ? '+' : '-'}
                            {formatCurrency(kas.nominal)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(kas.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </AppLayout>
  );
}
