import { Home, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, role, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20 font-bold">
            RT
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold">Iuran RT</h1>
            <p className="text-xs text-primary-foreground/80">Sistem Pengelolaan Kas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="font-medium">{user?.email}</span>
            <span className="rounded bg-primary-foreground/20 px-2 py-0.5 text-xs capitalize">
              {role}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
