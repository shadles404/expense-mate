import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTikTokPayments } from '@/hooks/useTikTokPayments';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useUserRole } from '@/hooks/useUserRole';
import { PaymentStatus } from '@/types/tiktok';
import { Plus, Check, X, Upload, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const paymentSchema = z.object({
  advertiser_id: z.string().min(1, 'Select an advertiser'),
  amount: z.number().min(0, 'Amount must be positive'),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function TikTokPayment() {
  const { payments, isLoading, createPayment, approvePayment, updatePayment } = useTikTokPayments();
  const { advertisers } = useTikTokAdvertisers();
  const { isAdmin } = useUserRole();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      advertiser_id: '',
      amount: 0,
      notes: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    await createPayment.mutateAsync({
      advertiser_id: data.advertiser_id,
      amount: data.amount,
      notes: data.notes,
    });
    form.reset();
    setDialogOpen(false);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      case 'unpaid':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Unpaid</Badge>;
    }
  };

  const handleReceiptUpload = async (paymentId: string) => {
    // For now, just prompt for URL - in production, implement file upload
    const url = prompt('Enter receipt URL:');
    if (url) {
      await updatePayment.mutateAsync({ id: paymentId, receipt_url: url });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Confirmation</h1>
            <p className="mt-1 text-muted-foreground">Track salary payments and approvals</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Record</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="advertiser_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advertiser *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          const advertiser = advertisers.find(a => a.id === value);
                          if (advertiser) {
                            form.setValue('amount', advertiser.salary);
                          }
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select advertiser" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {advertisers.map(a => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name} (${a.salary.toLocaleString()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPayment.isPending}>
                      {createPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Add Payment
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No payment records found. Add your first payment!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Approved At</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.advertiser?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.payment_date 
                            ? format(new Date(payment.payment_date), 'MMM d, yyyy')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {payment.receipt_url ? (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReceiptUpload(payment.id)}
                              className="gap-1"
                            >
                              <Upload className="h-3 w-3" />
                              Upload
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.approved_at 
                            ? format(new Date(payment.approved_at), 'MMM d, yyyy HH:mm')
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{payment.notes || '-'}</TableCell>
                        <TableCell>
                          {isAdmin && payment.status === 'unpaid' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => approvePayment.mutate({ id: payment.id, status: 'paid' })}
                              disabled={approvePayment.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && payment.status === 'paid' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => approvePayment.mutate({ id: payment.id, status: 'unpaid' })}
                              disabled={approvePayment.isPending}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
