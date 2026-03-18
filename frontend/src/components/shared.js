import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className,
}) {
  return (
    <div className={cn('glass-card p-10 text-center', className)}>
      {Icon && (
        <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

export function EntryListSkeleton({ count = 3 }) {
  return (
    <div className="glass-card p-6">
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageBackground({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Decorative gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/8 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />
        <div
          className="absolute bottom-20 -right-20 w-72 h-72 bg-accent/8 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function SidebarLayout({ sidebar, children, sidebarOpen, onSidebarClose }) {
  return (
    <div className="sidebar-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onSidebarClose}
        />
      )}
      <aside className={cn('sidebar', sidebarOpen && 'sidebar-open')}>
        {sidebar}
      </aside>
      <main className="sidebar-content min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
