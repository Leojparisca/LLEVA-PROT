import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/header';
import { siteConfig } from '@/config/site';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t bg-background">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-20 md:flex-row">
        <p className="text-balance text-center text-xs leading-loose text-muted-foreground md:text-sm">
          &copy; {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
