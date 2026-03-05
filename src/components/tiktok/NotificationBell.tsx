import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ContractAlerts } from './ContractAlerts';
import type { ContractNotification } from '@/hooks/useContractNotifications';

interface NotificationBellProps {
  notifications: ContractNotification[];
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const count = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <h4 className="font-semibold text-sm mb-3">Contract Alerts</h4>
        {count > 0 ? (
          <ContractAlerts notifications={notifications} compact />
        ) : (
          <p className="text-sm text-muted-foreground">No alerts</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
