'use client';

import { Newspaper, Trash2, IndianRupee, BarChart3, Copy, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardIcon, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* ─── Section 1: Manage Newspapers ─── */
function ManageNewspapers({
  newspapers,
  newNewspaperName,
  onNameChange,
  onAdd,
  onDelete,
  loading,
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardIcon className="bg-primary/10">
          <Newspaper className="w-5 h-5 text-primary" />
        </CardIcon>
        <div>
          <CardTitle>Manage Newspapers</CardTitle>
          <CardDescription>Add or remove newspapers for your university.</CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={onAdd} className="mt-5 mb-6">
        <div className="flex gap-2.5">
          <Input
            type="text"
            value={newNewspaperName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Times of India"
            required
          />
          <Button type="submit" disabled={loading || !newNewspaperName.trim()}>
            + Add
          </Button>
        </div>
      </form>

      {newspapers.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No Newspapers Added"
          description="Add newspapers using the form above."
          className="!p-10 !shadow-none !border-0"
        />
      ) : (
        <div className="space-y-2">
          {newspapers.map((newspaper) => (
            <div
              key={newspaper.id}
              className="flex items-center justify-between p-3.5 bg-secondary/50 rounded-lg border border-border hover:border-muted-foreground/20 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">{newspaper.name[0]}</span>
                </div>
                <span className="text-foreground font-semibold text-sm">{newspaper.name}</span>
              </div>
              <button
                onClick={() => onDelete(newspaper.id, newspaper.name)}
                disabled={loading}
                className="p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Delete"
                aria-label={`Delete ${newspaper.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Section 2: Configure Rates ─── */
function ConfigureRates({
  newspapers,
  selectedNewspaper,
  onSelectNewspaper,
  configMonth,
  onConfigMonthChange,
  rates,
  onRatesChange,
  onSubmit,
  loading,
}) {
  return (
    <Card className="mb-6" style={{ animationDelay: '0.05s' }}>
      <CardHeader>
        <CardIcon className="bg-accent/10">
          <IndianRupee className="w-5 h-5 text-accent" />
        </CardIcon>
        <div>
          <CardTitle>Configure Rates</CardTitle>
          <CardDescription>Set daily rates for a month. Auto-generates entries for every day.</CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Newspaper</Label>
            <Select
              value={selectedNewspaper?.id || ''}
              onChange={(e) => {
                const newspaper = newspapers.find(n => n.id === e.target.value);
                onSelectNewspaper(newspaper || null);
              }}
              required
            >
              <option value="">Choose a newspaper...</option>
              {newspapers.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Month</Label>
            <Input
              type="month"
              value={configMonth}
              onChange={(e) => onConfigMonthChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <Label>Daily Rates</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-2">
            {DAYS.map(day => (
              <div key={day} className="text-center">
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {day.slice(0, 3)}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rates[day]}
                    onChange={(e) => onRatesChange({ ...rates, [day]: parseFloat(e.target.value) || 0 })}
                    className="pl-7 text-center"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading || !selectedNewspaper}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Configuring...
            </span>
          ) : 'Configure Newspaper'}
        </Button>
      </form>
    </Card>
  );
}

/* ─── Section 3: Monthly Rates Overview ─── */
function RatesOverview({
  allRates,
  ratesMonth,
  onRatesMonthChange,
  loadingRates,
  editingNewspaperId,
  editRates,
  onStartEdit,
  onCancelEdit,
  onSaveRates,
  onEditRatesChange,
  savingRates,
}) {
  return (
    <Card className="mb-6" style={{ animationDelay: '0.1s' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <CardHeader className="!mb-0">
          <CardIcon className="bg-success/10">
            <BarChart3 className="w-5 h-5 text-success" />
          </CardIcon>
          <div>
            <CardTitle>Monthly Rates Overview</CardTitle>
            <CardDescription>View and edit rates for all configured newspapers.</CardDescription>
          </div>
        </CardHeader>
        <Input
          type="month"
          value={ratesMonth}
          onChange={(e) => onRatesMonthChange(e.target.value)}
          className="w-auto"
        />
      </div>

      {loadingRates ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-secondary/50 rounded-lg p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
              <div className="grid grid-cols-7 gap-3">
                {[1,2,3,4,5,6,7].map(j => (
                  <Skeleton key={j} className="h-10 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : allRates.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No Rates Configured"
          description="No newspapers have been configured for this month yet."
          className="!p-10 !shadow-none !border-0"
        />
      ) : (
        <div className="space-y-3">
          {allRates.map(newspaper => {
            const isEditing = editingNewspaperId === newspaper.id;
            return (
              <div
                key={newspaper.id}
                className={`rounded-lg border transition-all ${
                  isEditing
                    ? 'border-primary/30 bg-primary/5 shadow-md ring-1 ring-primary/20'
                    : 'border-border bg-secondary/30 hover:border-muted-foreground/20'
                }`}
              >
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      newspaper.configured ? 'bg-success/10' : 'bg-warning/10'
                    }`}>
                      <span className={`text-xs font-bold ${
                        newspaper.configured ? 'text-success' : 'text-warning'
                      }`}>
                        {newspaper.name[0]}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{newspaper.name}</h3>
                    <Badge variant={newspaper.configured ? 'success' : 'warning'}>
                      {newspaper.configured ? 'Active' : 'Pending'}
                    </Badge>
                  </div>
                  {newspaper.configured && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={() => onSaveRates(newspaper.id)}
                            disabled={savingRates}
                            variant="success"
                            size="sm"
                          >
                            {savingRates ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={onCancelEdit}
                            disabled={savingRates}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => onStartEdit(newspaper)}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {newspaper.configured && (
                  <div className="px-4 sm:px-5 py-3.5">
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      {DAYS.map(day => (
                        <div key={day} className="text-center">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                            {day.slice(0, 3)}
                          </div>
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary text-xs font-medium">₹</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editRates[day] ?? 0}
                                onChange={(e) => onEditRatesChange({ ...editRates, [day]: parseFloat(e.target.value) || 0 })}
                                className="pl-6 text-center font-semibold"
                              />
                            </div>
                          ) : (
                            <div className="px-2 py-2 bg-card rounded-lg border border-border text-sm font-bold text-foreground">
                              ₹{parseFloat(newspaper.rates[day] || 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ─── Section 4: Copy Rates ─── */
function CopyRatesSection({
  copySourceMonth,
  onSourceChange,
  copyTargetMonth,
  onTargetChange,
  onCopy,
  copying,
}) {
  return (
    <Card style={{ animationDelay: '0.15s' }}>
      <CardHeader>
        <CardIcon className="bg-warning/10">
          <Copy className="w-5 h-5 text-warning" />
        </CardIcon>
        <div>
          <CardTitle>Copy Rates</CardTitle>
          <CardDescription>Copy rates from a previous month. Already configured newspapers are skipped.</CardDescription>
        </div>
      </CardHeader>

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
        <div className="flex-1 w-full">
          <Label>From Month</Label>
          <Input
            type="month"
            value={copySourceMonth}
            onChange={(e) => onSourceChange(e.target.value)}
            placeholder="Select source month"
          />
        </div>

        <div className="hidden sm:flex items-center pb-3">
          <ArrowRight className="w-5 h-5 text-muted-foreground/40" />
        </div>

        <div className="flex-1 w-full">
          <Label>To Month</Label>
          <Input
            type="month"
            value={copyTargetMonth}
            onChange={(e) => onTargetChange(e.target.value)}
          />
        </div>

        <Button
          onClick={onCopy}
          disabled={copying || !copySourceMonth || !copyTargetMonth}
        >
          {copying ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Copying...
            </span>
          ) : 'Copy Rates'}
        </Button>
      </div>

      <div className="mt-5 p-3.5 bg-warning/5 rounded-lg border border-warning/10 flex items-start gap-2.5">
        <div className="w-6 h-6 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5 text-warning" />
        </div>
        <p className="text-xs text-warning font-medium leading-relaxed">
          This will copy rates for all newspapers configured in the source month and generate daily entries for the target month. Already configured newspapers will be skipped.
        </p>
      </div>
    </Card>
  );
}

export function ConfigureTab({
  newspapers,
  newNewspaperName,
  onNewspaperNameChange,
  onAddNewspaper,
  onDeleteNewspaper,
  selectedNewspaper,
  onSelectNewspaper,
  configMonth,
  onConfigMonthChange,
  rates,
  onRatesChange,
  onConfigureNewspaper,
  allRates,
  ratesMonth,
  onRatesMonthChange,
  loadingRates,
  editingNewspaperId,
  editRates,
  onStartEdit,
  onCancelEdit,
  onSaveRates,
  onEditRatesChange,
  savingRates,
  copySourceMonth,
  onCopySourceChange,
  copyTargetMonth,
  onCopyTargetChange,
  onCopyRates,
  copyingRates,
  loading,
}) {
  return (
    <>
      <ManageNewspapers
        newspapers={newspapers}
        newNewspaperName={newNewspaperName}
        onNameChange={onNewspaperNameChange}
        onAdd={onAddNewspaper}
        onDelete={onDeleteNewspaper}
        loading={loading}
      />
      <ConfigureRates
        newspapers={newspapers}
        selectedNewspaper={selectedNewspaper}
        onSelectNewspaper={onSelectNewspaper}
        configMonth={configMonth}
        onConfigMonthChange={onConfigMonthChange}
        rates={rates}
        onRatesChange={onRatesChange}
        onSubmit={onConfigureNewspaper}
        loading={loading}
      />
      <RatesOverview
        allRates={allRates}
        ratesMonth={ratesMonth}
        onRatesMonthChange={onRatesMonthChange}
        loadingRates={loadingRates}
        editingNewspaperId={editingNewspaperId}
        editRates={editRates}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onSaveRates={onSaveRates}
        onEditRatesChange={onEditRatesChange}
        savingRates={savingRates}
      />
      <CopyRatesSection
        copySourceMonth={copySourceMonth}
        onSourceChange={onCopySourceChange}
        copyTargetMonth={copyTargetMonth}
        onTargetChange={onCopyTargetChange}
        onCopy={onCopyRates}
        copying={copyingRates}
      />
    </>
  );
}
