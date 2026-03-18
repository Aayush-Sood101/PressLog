import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'glass-card p-5 sm:p-6 animate-fade-in-up',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center gap-3 mb-4', className)}
      {...props}
    />
  );
}

function CardIcon({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h2
      className={cn(
        'text-lg sm:text-xl font-bold text-foreground tracking-tight',
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-muted-foreground text-xs font-medium', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return <div className={cn('', className)} {...props} />;
}

export { Card, CardHeader, CardIcon, CardTitle, CardDescription, CardContent };
