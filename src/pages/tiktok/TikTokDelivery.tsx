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
import { useTikTokDeliveries } from '@/hooks/useTikTokDeliveries';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useUserRole } from '@/hooks/useUserRole';
import { DeliveryStatus } from '@/types/tiktok';
import { Plus, Check, X, ExternalLink, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const deliverySchema = z.object({
  advertiser_id: z.string().min(1, 'Select an advertiser'),
  video_link: z.string().url('Enter a valid URL'),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

export default function TikTokDelivery() {
  const { deliveries, isLoading, createDelivery, updateDeliveryStatus } = useTikTokDeliveries();
  const { advertisers } = useTikTokAdvertisers();
  const { isAdmin } = useUserRole();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      advertiser_id: '',
      video_link: '',
      notes: '',
    },
  });

  const onSubmit = async (data: DeliveryFormData) => {
    await createDelivery.mutateAsync({
      advertiser_id: data.advertiser_id,
      video_link: data.video_link,
      notes: data.notes,
    });
    form.reset();
    setDialogOpen(false);
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Delivery</h1>
            <p className="mt-1 text-muted-foreground">Track video submissions and approvals</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Submit Delivery
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Video Delivery</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="advertiser_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advertiser *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select advertiser" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {advertisers.map(a => (
                              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="video_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Link *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
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
                    <Button type="submit" disabled={createDelivery.isPending}>
                      {createDelivery.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Submit
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No deliveries found. Submit your first video!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Video Link</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified At</TableHead>
                      <TableHead>Notes</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">
                          {delivery.advertiser?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <a
                            href={delivery.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          {format(new Date(delivery.submission_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                        <TableCell>
                          {delivery.verified_at 
                            ? format(new Date(delivery.verified_at), 'MMM d, yyyy HH:mm')
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{delivery.notes || '-'}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            {delivery.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateDeliveryStatus.mutate({ id: delivery.id, status: 'approved' })}
                                  disabled={updateDeliveryStatus.isPending}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateDeliveryStatus.mutate({ id: delivery.id, status: 'rejected' })}
                                  disabled={updateDeliveryStatus.isPending}
                                  className="text-destructive hover:text-destructive/90"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
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
