'use client';

import { format } from 'date-fns';
import { FileSpreadsheet, Download, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardIcon, CardTitle, CardDescription } from '@/components/ui/card';
import { MonthNavigator } from '@/components/date-navigator';

export function ReportsTab({
  currentDate,
  onChangeMonth,
  onDownload,
  loading,
}) {
  return (
    <Card>
      <CardHeader>
        <CardIcon className="bg-destructive/10">
          <FileSpreadsheet className="w-5 h-5 text-destructive" />
        </CardIcon>
        <div>
          <CardTitle>Download Reports</CardTitle>
          <CardDescription>Generate and download monthly Excel reports.</CardDescription>
        </div>
      </CardHeader>

      <MonthNavigator
        currentDate={currentDate}
        onChangeMonth={onChangeMonth}
        className="mb-6"
      />

      <Button
        onClick={onDownload}
        disabled={loading}
        className="w-full sm:w-auto gap-2.5 shadow-sm"
      >
        {loading ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download Excel Report
          </>
        )}
      </Button>

      {/* Info card */}
      <div className="mt-6 p-5 bg-primary/5 rounded-lg border border-primary/10">
        <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          Report Includes
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            'Date-wise newspaper delivery status',
            'Day of week and newspaper rates',
            'Who marked each entry',
            'Summary with totals and delivery rate',
            'Total receivable amount',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary" strokeWidth={3} />
              </span>
              <span className="text-xs font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
