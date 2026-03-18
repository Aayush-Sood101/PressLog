'use client';

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DateNavigator({
  selectedDate,
  onDateChange,
  onToday,
  className,
}) {
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  const changeDate = (delta) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    onDateChange(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className={cn('glass-card p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => changeDate(-1)}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <div className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {format(new Date(selectedDate), 'EEEE')}
          </div>
          <div className="text-sm text-muted-foreground font-medium mt-0.5 flex items-center justify-center gap-2">
            {format(new Date(selectedDate), 'MMMM d, yyyy')}
            {isToday && <Badge variant="default">Today</Badge>}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => changeDate(1)}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-xs text-foreground font-medium bg-card hover:border-muted-foreground/30 transition cursor-pointer"
        />
        {!isToday && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(format(new Date(), 'yyyy-MM-dd'))}
          >
            Jump to Today
          </Button>
        )}
      </div>
    </div>
  );
}

export function MonthNavigator({
  currentDate,
  onChangeMonth,
  className,
}) {
  return (
    <div className={cn('flex items-center justify-center gap-3 p-4 bg-secondary/50 rounded-lg border border-border', className)}>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onChangeMonth(-1)}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-base font-bold text-foreground min-w-[160px] text-center tracking-tight">
        {format(currentDate, 'MMMM yyyy')}
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onChangeMonth(1)}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
