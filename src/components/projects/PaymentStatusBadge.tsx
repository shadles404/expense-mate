import { Badge } from '@/components/ui/badge';
import { PaymentProjectStatus } from '@/types/expense';
import { cn } from '@/lib/utils';

interface PaymentStatusBadgeProps {
  status: PaymentProjectStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const variants = {
    unpaid: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20',
    partially_paid: 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20',
    paid: 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20',
  };

  const labels = {
    unpaid: 'Unpaid',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
  };

  return (
    <Badge variant="outline" className={cn(variants[status], className)}>
      {labels[status]}
    </Badge>
  );
}
