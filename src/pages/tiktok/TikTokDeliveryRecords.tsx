import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useTikTokDeliveryRecords } from '@/hooks/useTikTokDeliveryRecords';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useUserRole } from '@/hooks/useUserRole';
import { DeliveryRecordStatus, DELIVERY_RECORD_STATUSES } from '@/types/tiktok';
import { Plus, Search, Loader2, CalendarIcon, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const deliveryRecordSchema = z.object({
  delivery_person_name: z.string().min(1, 'Delivery person name is required').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  advertiser_id: z.string().min(1, 'Select an influencer'),
  status: z.enum(['pending', 'completed', 'cancelled'] as const),
  delivery_date: z.date({ required_error: 'Date is required' }),
  delivery_time: z.string().min(1, 'Time is required'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type DeliveryRecordFormData = z.infer<typeof deliveryRecordSchema>;

export default function TikTokDeliveryRecords() {
  const { deliveryRecords, isLoading, createDeliveryRecord, updateDeliveryRecord } = useTikTokDeliveryRecords();
  const { advertisers } = useTikTokAdvertisers();
  const { isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<DeliveryRecordFormData>({
    resolver: zodResolver(deliveryRecordSchema),
    defaultValues: {
      delivery_person_name: '',
      phone: '',
      advertiser_id: '',
      status: 'pending',
      delivery_date: new Date(),
      delivery_time: '09:00',
      notes: '',
    },
  });

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return deliveryRecords;
    const query = searchQuery.toLowerCase();
    return deliveryRecords.filter(r =>
      r.delivery_person_name.toLowerCase().includes(query) ||
      r.advertiser?.name.toLowerCase().includes(query)
    );
  }, [deliveryRecords, searchQuery]);

  const onSubmit = async (data: DeliveryRecordFormData) => {
    await createDeliveryRecord.mutateAsync({
      delivery_person_name: data.delivery_person_name,
      phone: data.phone || undefined,
      advertiser_id: data.advertiser_id,
      status: data.status,
      delivery_date: format(data.delivery_date, 'yyyy-MM-dd'),
      delivery_time: data.delivery_time,
      notes: data.notes || undefined,
    });
    form.reset({
      delivery_person_name: '',
      phone: '',
      advertiser_id: '',
      status: 'pending',
      delivery_date: new Date(),
      delivery_time: '09:00',
      notes: '',
    });
    setActiveTab('history');
  };

  const getStatusBadge = (status: DeliveryRecordStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery Records</h1>
          <p className="mt-1 text-muted-foreground">Track delivery personnel and their assignments</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="history">Delivery History</TabsTrigger>
            {isAdmin && <TabsTrigger value="add">Register Delivery</TabsTrigger>}
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by person name or influencer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Delivery History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'No matching records found.' : 'No delivery records yet.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Delivery Person</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Assigned Influencer</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                          {isAdmin && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.delivery_person_name}</TableCell>
                            <TableCell>{record.phone || '-'}</TableCell>
                            <TableCell>{record.advertiser?.name || 'Unknown'}</TableCell>
                            <TableCell>{format(new Date(record.delivery_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{record.delivery_time}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{record.notes || '-'}</TableCell>
                            {isAdmin && (
                              <TableCell>
                                <Select
                                  value={record.status}
                                  onValueChange={(value) =>
                                    updateDeliveryRecord.mutate({ id: record.id, status: value as DeliveryRecordStatus })
                                  }
                                >
                                  <SelectTrigger className="w-[130px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DELIVERY_RECORD_STATUSES.map(s => (
                                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
          </TabsContent>

          {isAdmin && (
            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Register Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField control={form.control} name="delivery_person_name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Person Name *</FormLabel>
                            <FormControl><Input placeholder="Enter name" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input placeholder="Phone number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="advertiser_id" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned Influencer *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select influencer" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {advertisers.map(a => (
                                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="status" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Status *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DELIVERY_RECORD_STATUSES.map(s => (
                                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="delivery_date" render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "MMM d, yyyy") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="delivery_time" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time *</FormLabel>
                            <FormControl><Input type="time" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl><Textarea placeholder="Optional notes" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="flex justify-end">
                        <Button type="submit" disabled={createDeliveryRecord.isPending} className="gap-2">
                          {createDeliveryRecord.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                          Register Delivery
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
