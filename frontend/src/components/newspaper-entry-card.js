import { Check, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusConfig = {
  received: {
    icon: Check,
    iconClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/20',
    ringClass: 'ring-success/30',
    label: 'Received',
  },
  not_received: {
    icon: X,
    iconClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/20',
    ringClass: 'ring-destructive/30',
    label: 'Not received',
  },
  unmarked: {
    icon: HelpCircle,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: '',
    ringClass: '',
    label: 'Unmarked',
  },
};

export function NewspaperEntryCard({
  entry,
  isMarking,
  onMark,
  index = 0,
}) {
  const status = statusConfig[entry.status] || statusConfig.unmarked;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'glass-card p-4 transition-all duration-300 hover:shadow-md',
        entry.status !== 'unmarked' && `border-l-[3px] ${status.borderClass}`
      )}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              status.bgClass
            )}
          >
            <StatusIcon className={cn('w-5 h-5', status.iconClass)} strokeWidth={entry.status === 'unmarked' ? 2 : 2.5} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              {entry.newspapers?.name || 'Unknown Newspaper'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground font-medium">
                ₹{parseFloat(entry.rate || 0).toFixed(2)}
              </span>
              {entry.status !== 'unmarked' && entry.markedByEmail && (
                <>
                  <span className="text-border">•</span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                    {entry.markedByEmail}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={() => onMark(entry.id, 'received')}
            disabled={isMarking}
            variant={entry.status === 'received' ? 'outline' : 'success'}
            size="sm"
            className={cn(
              entry.status === 'received' &&
                'ring-2 ring-success ring-offset-1 ring-offset-card text-success'
            )}
          >
            {isMarking ? '...' : '✓ Yes'}
          </Button>
          <Button
            onClick={() => onMark(entry.id, 'not_received')}
            disabled={isMarking}
            variant={entry.status === 'not_received' ? 'outline' : 'destructive'}
            size="sm"
            className={cn(
              entry.status === 'not_received' &&
                'ring-2 ring-destructive ring-offset-1 ring-offset-card text-destructive'
            )}
          >
            {isMarking ? '...' : '✗ No'}
          </Button>
        </div>
      </div>
    </div>
  );
}
