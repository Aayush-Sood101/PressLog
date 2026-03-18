import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastConfig = {
  success: {
    icon: Check,
    containerClass: 'border-success/20 bg-success/5',
    iconBg: 'bg-success/10',
    iconClass: 'text-success',
    textClass: 'text-success',
  },
  error: {
    icon: AlertTriangle,
    containerClass: 'border-destructive/20 bg-destructive/5',
    iconBg: 'bg-destructive/10',
    iconClass: 'text-destructive',
    textClass: 'text-destructive',
  },
  info: {
    icon: Info,
    containerClass: 'border-primary/20 bg-primary/5',
    iconBg: 'bg-primary/10',
    iconClass: 'text-primary',
    textClass: 'text-primary',
  },
};

export function Toast({ message, type = 'success', onDismiss }) {
  if (!message) return null;

  const config = toastConfig[type] || toastConfig.info;
  const ToastIcon = config.icon;

  return (
    <div className={cn('glass-card p-4 mb-6 animate-slide-down', config.containerClass)}>
      <div className="flex items-center gap-2.5">
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', config.iconBg)}>
          <ToastIcon className={cn('w-3.5 h-3.5', config.iconClass)} strokeWidth={2.5} />
        </div>
        <p className={cn('text-sm font-medium flex-1', config.textClass)}>{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition p-1"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
