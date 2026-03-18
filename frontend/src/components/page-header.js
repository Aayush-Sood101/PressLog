'use client';

import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Newspaper, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  subtitle,
  icon: Icon = Newspaper,
  actions,
  showHome = true,
  showThemeToggle = true,
  onMenuToggle,
  className,
}) {
  const router = useRouter();

  return (
    <div className={cn('bg-card border-b border-border px-4 sm:px-6 py-4 animate-fade-in-up', className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onMenuToggle}
              className="md:hidden text-muted-foreground"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <Icon className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {actions}
          {showThemeToggle && <ThemeToggle />}
          {showHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="hidden sm:inline-flex text-muted-foreground"
            >
              Home
            </Button>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
}
