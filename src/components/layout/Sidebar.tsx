import { Home, Users, Tag, FileText, BookOpen, BarChart3, Settings, Receipt } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const adminNavItems = [
  { icon: Home, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Data Rumah', path: '/admin/rumah' },
  { icon: Tag, label: 'Kategori Iuran', path: '/admin/kategori' },
  { icon: Settings, label: 'Generate Tagihan', path: '/admin/generate' },
  { icon: FileText, label: 'Daftar Tagihan', path: '/admin/tagihan' },
  { icon: BookOpen, label: 'Buku Kas', path: '/admin/kas' },
  { icon: BarChart3, label: 'Laporan Iuran', path: '/admin/laporan' },
];

const wargaNavItems = [
  { icon: Home, label: 'Dashboard', path: '/warga' },
  { icon: Receipt, label: 'Tagihan Saya', path: '/warga/tagihan' },
];

export function Sidebar() {
  const { role } = useAuth();
  const navItems = role === 'admin' ? adminNavItems : wargaNavItems;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
