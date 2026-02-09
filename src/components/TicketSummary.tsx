import { useTicketSummary } from '@/hooks/useTicketSummary';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'new':
      return 'default';
    case 'in_progress':
    case 'in-progress':
      return 'secondary';
    case 'resolved':
      return 'default';
    case 'closed':
      return 'outline';
    default:
      return 'secondary';
  }
};

const formatStatusLabel = (status: string) => {
  return status.replace('_', ' ').replace('-', ' ').split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const TicketSummary = () => {
  const { weeklyTicketCounts, totalTicketCounts, loading, error } = useTicketSummary();

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t space-y-2">
        <p className="text-sm text-muted-foreground">Past 7 days summary:</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-3">All time summary:</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={`total-${i}`} className="h-6 w-16" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 pt-3 border-t">
        <p className="text-sm text-destructive">Failed to load ticket summary</p>
      </div>
    );
  }

  if (weeklyTicketCounts.length === 0 && totalTicketCounts.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t">
        <p className="text-sm text-muted-foreground">Past 7 days summary:</p>
        <p className="text-sm text-muted-foreground mt-1">No tickets in the past 7 days</p>
        <p className="text-sm text-muted-foreground mt-3">All time summary:</p>
        <p className="text-sm text-muted-foreground mt-1">No tickets found</p>
      </div>
    );
  }

  const totalWeeklyTickets = weeklyTicketCounts.reduce((sum, item) => sum + item.count, 0);
  const totalAllTimeTickets = totalTicketCounts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="mt-3 pt-3 border-t">
      {/* Weekly Summary */}
      <p className="text-sm text-muted-foreground mb-2">
        Past 7 days summary ({totalWeeklyTickets} total):
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {weeklyTicketCounts.length > 0 ? (
          weeklyTicketCounts.map(({ status, count }) => (
            <Badge 
              key={`weekly-${status}`} 
              variant={getStatusVariant(status)}
              className="text-xs"
            >
              {formatStatusLabel(status)}: {count}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No tickets in the past 7 days</span>
        )}
      </div>

      {/* All Time Summary */}
      <p className="text-sm text-muted-foreground mb-2">
        All time summary ({totalAllTimeTickets} total):
      </p>
      <div className="flex flex-wrap gap-2">
        {totalTicketCounts.length > 0 ? (
          totalTicketCounts.map(({ status, count }) => (
            <Badge 
              key={`total-${status}`} 
              variant={getStatusVariant(status)}
              className="text-xs"
            >
              {formatStatusLabel(status)}: {count}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No tickets found</span>
        )}
      </div>
    </div>
  );
};