import { Home, Users, Tag, FileText, BookOpen, BarChart3, Receipt } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const adminNavItems = [
  { icon: Home, label: 'Home', path: '/admin', end: true },
  { icon: Users, label: 'Rumah', path: '/admin/rumah', end: false },
  { icon: Tag, label: 'Kategori', path: '/admin/kategori', end: false },
  { icon: FileText, label: 'Tagihan', path: '/admin/tagihan', end: false },
  { icon: BookOpen, label: 'Kas', path: '/admin/kas', end: false },
];

const wargaNavItems = [
  { icon: Home, label: 'Home', path: '/warga', end: true },
  { icon: Receipt, label: 'Tagihan', path: '/warga/tagihan', end: false },
];

export function BottomNav() {
  const { role } = useAuth();
  const navItems = role === 'admin' ? adminNavItems : wargaNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
