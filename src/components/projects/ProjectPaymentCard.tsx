import { useState } from 'react';
import { DollarSign, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentProjectStatus } from '@/types/expense';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ProjectPaymentCardProps {
  totalCost: number;
  amountPaid: number;
  paymentStatus: PaymentProjectStatus;
  onRecordPayment: (amount: number) => Promise<void>;
  isUpdating?: boolean;
}

export function ProjectPaymentCard({ 
  totalCost, 
  amountPaid, 
  paymentStatus, 
  onRecordPayment,
  isUpdating 
}: ProjectPaymentCardProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const balanceDue = totalCost - amountPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    await onRecordPayment(amount);
    setPaymentAmount('');
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Payment Status</CardTitle>
          <PaymentStatusBadge status={paymentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-lg font-bold text-green-600">
              ${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className={`text-lg font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-foreground'}`}>
              ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {balanceDue > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <CreditCard className="h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={balanceDue}
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Balance due: ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating || !paymentAmount}>
                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Record Payment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
