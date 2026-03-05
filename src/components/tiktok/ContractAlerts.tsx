import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import type { ContractNotification } from '@/hooks/useContractNotifications';

interface ContractAlertsProps {
  notifications: ContractNotification[];
  compact?: boolean;
}

export function ContractAlerts({ notifications, compact }: ContractAlertsProps) {
  if (notifications.length === 0) return null;

  if (compact) {
    return (
      <div className="space-y-2">
        {notifications.slice(0, 3).map(n => (
          <div key={n.influencer.id} className="flex items-center gap-2 text-sm">
            <AlertTriangle className={`h-4 w-4 shrink-0 ${n.severity === 'urgent' ? 'text-destructive' : 'text-yellow-500'}`} />
            <span className="font-medium">{n.influencer.name}</span>
            <span className="text-muted-foreground">— {n.message}</span>
          </div>
        ))}
        {notifications.length > 3 && (
          <p className="text-xs text-muted-foreground">+{notifications.length - 3} more</p>
        )}
      </div>
    );
  }

  return (
    <Card className="border-yellow-500/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Contract Expiry Alerts ({notifications.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.influencer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${
                  n.severity === 'urgent' ? 'bg-destructive' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="font-medium text-sm">{n.influencer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Contract ends: {n.influencer.agreement_end_date ? format(parseISO(n.influencer.agreement_end_date), 'MMMM d, yyyy') : '—'}
                  </p>
                </div>
              </div>
              <Badge variant={n.severity === 'urgent' ? 'destructive' : 'secondary'}>
                {n.daysRemaining <= 0 ? 'Expired' : `${n.daysRemaining}d left`}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
