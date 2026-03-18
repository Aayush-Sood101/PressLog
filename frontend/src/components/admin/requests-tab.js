'use client';

import { Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardIcon, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';

export function RequestsTab({
  joinRequests,
  loading,
  processingRequestId,
  onApproveReject,
}) {
  return (
    <Card>
      <CardHeader>
        <CardIcon className="bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </CardIcon>
        <div>
          <CardTitle>Join Requests</CardTitle>
          <CardDescription>Manage users requesting to join your university.</CardDescription>
        </div>
      </CardHeader>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : joinRequests.length === 0 ? (
        <EmptyState
          icon={Check}
          title="All Clear!"
          description="No pending join requests at this time."
          className="!p-10 !shadow-none !border-0"
        />
      ) : (
        <div className="space-y-2.5">
          {joinRequests.map((request, i) => {
            const isProcessing = processingRequestId === request.id;
            return (
              <div
                key={request.id}
                className="border border-border rounded-lg p-4 hover:border-muted-foreground/20 hover:shadow-sm transition-all bg-card/60"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-primary-foreground font-bold text-sm">
                        {(request.userName || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{request.userName}</h3>
                      <p className="text-xs text-muted-foreground font-medium">{request.userEmail}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">
                        {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <Button
                      onClick={() => onApproveReject(request.id, 'approved')}
                      disabled={isProcessing}
                      variant="success"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      {isProcessing ? '...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => onApproveReject(request.id, 'rejected')}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none text-destructive border-destructive/20 hover:bg-destructive/5"
                    >
                      {isProcessing ? '...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
