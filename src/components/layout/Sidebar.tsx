import { Home, Users, Tag, FileText, BookOpen, BarChart3, Settings, Receipt } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const adminNavItems = [
  { icon: Home, label: 'Dashboard', path: '/admin', end: true },
  { icon: Users, label: 'Data Rumah', path: '/admin/rumah', end: false },
  { icon: Tag, label: 'Kategori Iuran', path: '/admin/kategori', end: false },
  { icon: Settings, label: 'Generate Tagihan', path: '/admin/generate', end: false },
  { icon: FileText, label: 'Daftar Tagihan', path: '/admin/tagihan', end: false },
  { icon: BookOpen, label: 'Buku Kas', path: '/admin/kas', end: false },
  { icon: BarChart3, label: 'Laporan Iuran', path: '/admin/laporan', end: false },
];

const wargaNavItems = [
  { icon: Home, label: 'Dashboard', path: '/warga', end: true },
  { icon: Receipt, label: 'Tagihan Saya', path: '/warga/tagihan', end: false },
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
            end={item.end}
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
