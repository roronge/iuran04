import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 pb-20 md:pb-4 overflow-auto">
          <div className="mx-auto max-w-5xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <footer className="hidden md:block border-t border-border py-3 text-center text-xs text-muted-foreground">
        Prompt by: Heru Septiana Nugraha
      </footer>
      <BottomNav />
    </div>
  );
}
