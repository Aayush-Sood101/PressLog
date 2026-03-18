'use client';

import { format } from 'date-fns';
import { Newspaper, Calendar } from 'lucide-react';
import { DateNavigator } from '@/components/date-navigator';
import { NewspaperEntryCard } from '@/components/newspaper-entry-card';
import { EmptyState, EntryListSkeleton } from '@/components/shared';

export function MarkTab({
  selectedDate,
  onDateChange,
  entries,
  loading,
  markingId,
  onMark,
  onSwitchToConfig,
}) {
  return (
    <>
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        className="mb-6 animate-fade-in-up"
      />

      <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {loading ? (
          <EntryListSkeleton />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No Newspapers for This Date"
            description={`Newspapers haven't been configured for ${format(new Date(selectedDate), 'MMMM yyyy')} yet.`}
            action={onSwitchToConfig}
            actionLabel="Configure Now"
          />
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <NewspaperEntryCard
                key={entry.id}
                entry={entry}
                isMarking={markingId === entry.id}
                onMark={onMark}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
