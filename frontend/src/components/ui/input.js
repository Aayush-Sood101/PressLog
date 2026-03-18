import { cn } from '@/lib/utils';

function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground text-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        className
      )}
      {...props}
    />
  );
}

function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        'block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5',
        className
      )}
      {...props}
    />
  );
}

export { Input, Select, Label };
