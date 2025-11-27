import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Rumah {
  id: string;
  blok: string | null;
  no_rumah: string;
  kepala_keluarga: string;
  no_hp: string | null;
  email: string | null;
  status: string;
  user_id: string | null;
}

export default function DataRumahPage() {
  const [rumahList, setRumahList] = useState<Rumah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRumah, setEditingRumah] = useState<Rumah | null>(null);
  const [formData, setFormData] = useState({
    blok: '',
    no_rumah: '',
    kepala_keluarga: '',
    no_hp: '',
    email: '',
  });

  useEffect(() => {
    fetchRumah();
  }, []);

  const fetchRumah = async () => {
    try {
      const { data, error } = await supabase
        .from('rumah')
        .select('*')
        .order('blok')
        .order('no_rumah');

      if (error) throw error;
      setRumahList(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data rumah');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRumah) {
        const { error } = await supabase
          .from('rumah')
          .update(formData)
          .eq('id', editingRumah.id);

        if (error) throw error;

        // Jika email berubah dan ada user_id terhubung, update juga email auth user
        if (editingRumah.user_id && formData.email !== editingRumah.email && formData.email) {
          try {
            const { error: emailError } = await supabase.functions.invoke('update-user-email', {
              body: { user_id: editingRumah.user_id, new_email: formData.email }
            });
            if (emailError) {
              console.error('Error updating auth email:', emailError);
              toast.warning('Data rumah tersimpan, tapi email login gagal diperbarui');
            }
          } catch (emailErr) {
            console.error('Error calling update-user-email:', emailErr);
          }
        }

        toast.success('Data rumah berhasil diperbarui');
      } else {
        const { error } = await supabase.from('rumah').insert(formData);

        if (error) throw error;
        toast.success('Rumah berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingRumah(null);
      setFormData({ blok: '', no_rumah: '', kepala_keluarga: '', no_hp: '', email: '' });
      fetchRumah();
    } catch (error: any) {
      toast.error('Gagal menyimpan data', { description: error.message });
    }
  };

  const handleEdit = (rumah: Rumah) => {
    setEditingRumah(rumah);
    setFormData({
      blok: rumah.blok || '',
      no_rumah: rumah.no_rumah,
      kepala_keluarga: rumah.kepala_keluarga,
      no_hp: rumah.no_hp || '',
      email: rumah.email || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data rumah ini?')) return;

    try {
      const { error } = await supabase.from('rumah').delete().eq('id', id);
      if (error) throw error;
      toast.success('Data rumah berhasil dihapus');
      fetchRumah();
    } catch (error: any) {
      toast.error('Gagal menghapus data', { description: error.message });
    }
  };

  const filteredRumah = rumahList.filter(
    (r) =>
      r.kepala_keluarga.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.no_rumah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.blok && r.blok.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAktif = rumahList.filter((r) => r.status === 'aktif').length;
  const totalNonAktif = rumahList.filter((r) => r.status === 'non-aktif').length;

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
            <h1 className="text-2xl font-bold">Data Rumah</h1>
            <p className="text-muted-foreground">
              Kelola informasi rumah dan kepala keluarga di lingkungan RT.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:flex sm:gap-4">
            <StatCard title="Total" value={rumahList.length} className="py-2 px-3" />
            <StatCard title="Aktif" value={totalAktif} variant="teal" className="py-2 px-3" />
            <StatCard title="Non Aktif" value={totalNonAktif} variant="pink" className="py-2 px-3" />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Tambah Rumah Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              <div>
                <Label>Blok</Label>
                <Input
                  placeholder="A"
                  value={formData.blok}
                  onChange={(e) => setFormData({ ...formData, blok: e.target.value })}
                />
              </div>
              <div>
                <Label>No Rumah *</Label>
                <Input
                  placeholder="12"
                  value={formData.no_rumah}
                  onChange={(e) => setFormData({ ...formData, no_rumah: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Kepala Keluarga *</Label>
                <Input
                  placeholder="Nama KK"
                  value={formData.kepala_keluarga}
                  onChange={(e) => setFormData({ ...formData, kepala_keluarga: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>No HP</Label>
                <Input
                  placeholder="08xx"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@contoh.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="sm:col-span-6 flex justify-end">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Rumah
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Daftar Rumah</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari blok / no rumah / nama..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rumah</TableHead>
                    <TableHead>Kepala Keluarga</TableHead>
                    <TableHead className="hidden sm:table-cell">No HP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRumah.map((rumah) => (
                    <TableRow key={rumah.id}>
                      <TableCell>
                        <div className="font-medium">
                          {rumah.blok} {rumah.no_rumah}
                        </div>
                      </TableCell>
                      <TableCell>{rumah.kepala_keluarga}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {rumah.no_hp || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rumah.status === 'aktif' ? 'default' : 'secondary'}
                          className={rumah.status === 'aktif' ? 'bg-success' : ''}
                        >
                          {rumah.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rumah)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(rumah.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
              {editingRumah ? 'Edit Data Rumah' : 'Tambah Rumah Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Blok</Label>
                <Input
                  value={formData.blok}
                  onChange={(e) => setFormData({ ...formData, blok: e.target.value })}
                />
              </div>
              <div>
                <Label>No Rumah *</Label>
                <Input
                  value={formData.no_rumah}
                  onChange={(e) => setFormData({ ...formData, no_rumah: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Kepala Keluarga *</Label>
              <Input
                value={formData.kepala_keluarga}
                onChange={(e) => setFormData({ ...formData, kepala_keluarga: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>No HP</Label>
              <Input
                value={formData.no_hp}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
