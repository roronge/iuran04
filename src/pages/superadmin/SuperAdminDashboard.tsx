import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Users, Shield } from 'lucide-react';

interface DashboardStats {
  totalRT: number;
  totalAdmin: number;
  totalRumah: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRT: 0,
    totalAdmin: 0,
    totalRumah: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Count RT
      const { count: rtCount } = await supabase
        .from('rt')
        .select('*', { count: 'exact', head: true });

      // Count admins
      const { count: adminCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // Count rumah
      const { count: rumahCount } = await supabase
        .from('rumah')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalRT: rtCount || 0,
        totalAdmin: adminCount || 0,
        totalRumah: rumahCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Super Admin</h1>
          <p className="text-muted-foreground">
            Kelola semua RT dan admin dalam sistem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total RT"
            value={stats.totalRT}
            icon={<Building2 className="h-5 w-5" />}
            variant="teal"
          />
          <StatCard
            title="Total Admin"
            value={stats.totalAdmin}
            icon={<Shield className="h-5 w-5" />}
            variant="pink"
          />
          <StatCard
            title="Total Rumah"
            value={stats.totalRumah}
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Panduan Super Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">1. Kelola RT</h3>
              <p className="text-sm text-muted-foreground">
                Buat RT baru terlebih dahulu sebelum menambahkan admin.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">2. Assign Admin</h3>
              <p className="text-sm text-muted-foreground">
                Setelah RT dibuat, tambahkan admin dan assign ke RT yang sesuai.
                Setiap admin hanya bisa mengelola 1 RT.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">3. Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Pantau aktivitas semua RT melalui dashboard ini.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
