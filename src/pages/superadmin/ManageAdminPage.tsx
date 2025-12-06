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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';

interface AdminUser {
  id: string;
  user_id: string;
  rt_id: string | null;
  role: string;
  profile: {
    full_name: string | null;
  } | null;
  rt: {
    nama: string;
  } | null;
}

interface RT {
  id: string;
  nama: string;
}

export default function ManageAdminPage() {
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [rtList, setRtList] = useState<RT[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    rt_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch admins
      const { data: admins, error: adminsError } = await supabase
        .from('user_roles')
        .select('id, user_id, rt_id, role')
        .eq('role', 'admin');

      if (adminsError) throw adminsError;

      // Fetch profiles and RT info separately
      const adminData: AdminUser[] = [];
      for (const admin of admins || []) {
        let profile = null;
        let rt = null;

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', admin.user_id)
          .maybeSingle();
        profile = profileData;

        // Fetch RT
        if (admin.rt_id) {
          const { data: rtData } = await supabase
            .from('rt')
            .select('nama')
            .eq('id', admin.rt_id)
            .maybeSingle();
          rt = rtData;
        }

        adminData.push({
          ...admin,
          profile,
          rt
        });
      }

      // Fetch RT list
      const { data: rts, error: rtsError } = await supabase
        .from('rt')
        .select('id, nama')
        .order('nama');

      if (rtsError) throw rtsError;

      setAdminList(adminData);
      setRtList(rts || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create new user with admin role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: formData.full_name }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Gagal membuat user');
      }

      // Update user_roles to set role as admin and assign RT
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ 
          role: 'admin',
          rt_id: formData.rt_id 
        })
        .eq('user_id', authData.user.id);

      if (roleError) throw roleError;

      toast.success('Admin berhasil ditambahkan');
      setIsDialogOpen(false);
      setFormData({ email: '', password: '', full_name: '', rt_id: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menambah admin', { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (adminRole: AdminUser) => {
    if (!confirm('Yakin ingin menghapus admin ini? Role akan diubah menjadi warga.')) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'warga', rt_id: null })
        .eq('id', adminRole.id);

      if (error) throw error;
      toast.success('Admin berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menghapus admin', { description: error.message });
    }
  };

  const openAddDialog = () => {
    setFormData({ email: '', password: '', full_name: '', rt_id: '' });
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
            <h1 className="text-2xl font-bold">Kelola Admin RT</h1>
            <p className="text-muted-foreground">
              Assign admin untuk mengelola setiap RT.
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Admin
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Daftar Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>RT</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Belum ada admin terdaftar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminList.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                          {admin.profile?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {admin.rt?.nama || (
                            <span className="text-muted-foreground">Belum di-assign</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-primary">Admin</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveAdmin(admin)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Admin Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama Lengkap *</Label>
              <Input
                placeholder="Nama admin"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@contoh.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Min 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label>Assign ke RT *</Label>
              <Select
                value={formData.rt_id}
                onValueChange={(value) => setFormData({ ...formData, rt_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih RT" />
                </SelectTrigger>
                <SelectContent>
                  {rtList.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
