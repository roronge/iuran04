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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

interface RT {
  id: string;
  nama: string;
  alamat: string | null;
  created_at: string;
}

export default function ManageRTPage() {
  const [rtList, setRtList] = useState<RT[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRT, setEditingRT] = useState<RT | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
  });

  useEffect(() => {
    fetchRT();
  }, []);

  const fetchRT = async () => {
    try {
      const { data, error } = await supabase
        .from('rt')
        .select('*')
        .order('nama');

      if (error) throw error;
      setRtList(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data RT');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRT) {
        const { error } = await supabase
          .from('rt')
          .update(formData)
          .eq('id', editingRT.id);

        if (error) throw error;
        toast.success('Data RT berhasil diperbarui');
      } else {
        const { error } = await supabase.from('rt').insert(formData);

        if (error) throw error;
        toast.success('RT berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingRT(null);
      setFormData({ nama: '', alamat: '' });
      fetchRT();
    } catch (error: any) {
      toast.error('Gagal menyimpan data', { description: error.message });
    }
  };

  const handleEdit = (rt: RT) => {
    setEditingRT(rt);
    setFormData({
      nama: rt.nama,
      alamat: rt.alamat || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus RT ini? Semua data terkait akan terhapus.')) return;

    try {
      const { error } = await supabase.from('rt').delete().eq('id', id);
      if (error) throw error;
      toast.success('RT berhasil dihapus');
      fetchRT();
    } catch (error: any) {
      toast.error('Gagal menghapus RT', { description: error.message });
    }
  };

  const openAddDialog = () => {
    setEditingRT(null);
    setFormData({ nama: '', alamat: '' });
    setIsDialogOpen(true);
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
            <h1 className="text-2xl font-bold">Kelola RT</h1>
            <p className="text-muted-foreground">
              Tambah dan kelola data RT yang terdaftar dalam sistem.
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah RT
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Daftar RT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama RT</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rtList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Belum ada RT terdaftar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rtList.map((rt) => (
                      <TableRow key={rt.id}>
                        <TableCell className="font-medium">{rt.nama}</TableCell>
                        <TableCell>{rt.alamat || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(rt)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(rt.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRT ? 'Edit RT' : 'Tambah RT Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama RT *</Label>
              <Input
                placeholder="Contoh: RT 001"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input
                placeholder="Alamat RT"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
