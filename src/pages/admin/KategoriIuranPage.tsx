import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminRT } from '@/hooks/useAdminRT';

interface KategoriIuran {
  id: string;
  nama: string;
  nominal: number;
  deskripsi: string | null;
}

export default function KategoriIuranPage() {
  const { rtId, loading: rtLoading } = useAdminRT();
  const [kategoriList, setKategoriList] = useState<KategoriIuran[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nama: '',
    nominal: '',
    deskripsi: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (rtId) {
      fetchKategori();
    }
  }, [rtId]);

  const fetchKategori = async () => {
    try {
      const { data, error } = await supabase
        .from('kategori_iuran')
        .select('*')
        .eq('rt_id', rtId)
        .order('nama');

      if (error) throw error;
      setKategoriList(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rtId) {
      toast.error('RT tidak ditemukan');
      return;
    }

    const payload = {
      nama: formData.nama,
      nominal: parseInt(formData.nominal) || 0,
      deskripsi: formData.deskripsi || null,
      rt_id: rtId,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('kategori_iuran')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Kategori berhasil diperbarui');
      } else {
        const { error } = await supabase.from('kategori_iuran').insert(payload);

        if (error) throw error;
        toast.success('Kategori berhasil ditambahkan');
      }

      setFormData({ nama: '', nominal: '', deskripsi: '' });
      setEditingId(null);
      fetchKategori();
    } catch (error: any) {
      toast.error('Gagal menyimpan data', { description: error.message });
    }
  };

  const handleEdit = (kategori: KategoriIuran) => {
    setEditingId(kategori.id);
    setFormData({
      nama: kategori.nama,
      nominal: kategori.nominal.toString(),
      deskripsi: kategori.deskripsi || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;

    try {
      const { error } = await supabase.from('kategori_iuran').delete().eq('id', id);
      if (error) throw error;
      toast.success('Kategori berhasil dihapus');
      fetchKategori();
    } catch (error: any) {
      toast.error('Gagal menghapus kategori', { description: error.message });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ nama: '', nominal: '', deskripsi: '' });
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
          <h1 className="text-2xl font-bold">Kategori Iuran</h1>
          <p className="text-muted-foreground">
            Atur jenis iuran seperti kebersihan, keamanan, kas RT, dan lain-lain.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label>Nama Kategori *</Label>
                <Input
                  placeholder="Contoh: Iuran Kebersihan"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Nominal / bulan *</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Input
                  placeholder="Opsional"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  {editingId ? 'Update' : 'Tambah'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Daftar Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead className="hidden sm:table-cell">Deskripsi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kategoriList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Belum ada kategori iuran.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kategoriList.map((kategori) => (
                      <TableRow key={kategori.id}>
                        <TableCell className="font-medium">{kategori.nama}</TableCell>
                        <TableCell>{formatCurrency(kategori.nominal)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {kategori.deskripsi || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(kategori)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(kategori.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
    </AppLayout>
  );
}
