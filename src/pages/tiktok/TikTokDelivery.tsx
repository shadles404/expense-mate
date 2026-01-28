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
import { useTikTokProductDeliveries } from '@/hooks/useTikTokProductDeliveries';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useUserRole } from '@/hooks/useUserRole';
import { ProductDeliveryStatus, PRODUCT_DELIVERY_STATUSES } from '@/types/tiktok';
import { Plus, Search, Pencil, Trash2, Loader2, CalendarIcon, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const deliverySchema = z.object({
  advertiser_id: z.string().min(1, 'Select a celebrity/influencer'),
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  date_sent: z.date({ required_error: 'Date is required' }),
  status: z.enum(['pending', 'sent', 'returned'] as const),
  price: z.number().min(0, 'Price must be 0 or more'),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

export default function TikTokDelivery() {
  const { deliveries, isLoading, totalDeliveryPrice, createDelivery, updateDelivery, deleteDelivery } = useTikTokProductDeliveries();
  const { advertisers } = useTikTokAdvertisers();
  const { isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [editDelivery, setEditDelivery] = useState<typeof deliveries[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      advertiser_id: '',
      product_name: '',
      quantity: 1,
      date_sent: new Date(),
      status: 'pending',
      price: 0,
      notes: '',
    },
  });

  const editForm = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
  });

  const filteredDeliveries = useMemo(() => {
    if (!searchQuery.trim()) return deliveries;
    const query = searchQuery.toLowerCase();
    return deliveries.filter(d => 
      d.advertiser?.name.toLowerCase().includes(query) ||
      d.product_name.toLowerCase().includes(query)
    );
  }, [deliveries, searchQuery]);

  const onSubmit = async (data: DeliveryFormData) => {
    await createDelivery.mutateAsync({
      advertiser_id: data.advertiser_id,
      product_name: data.product_name,
      quantity: data.quantity,
      date_sent: format(data.date_sent, 'yyyy-MM-dd'),
      status: data.status,
      price: data.price,
      notes: data.notes,
    });
    form.reset({
      advertiser_id: '',
      product_name: '',
      quantity: 1,
      date_sent: new Date(),
      status: 'pending',
      price: 0,
      notes: '',
    });
    setActiveTab('records');
  };

  const handleEdit = (delivery: typeof deliveries[0]) => {
    setEditDelivery(delivery);
    editForm.reset({
      advertiser_id: delivery.advertiser_id,
      product_name: delivery.product_name,
      quantity: delivery.quantity,
      date_sent: new Date(delivery.date_sent),
      status: delivery.status,
      price: delivery.price,
      notes: delivery.notes || '',
    });
  };

  const onEditSubmit = async (data: DeliveryFormData) => {
    if (!editDelivery) return;
    await updateDelivery.mutateAsync({
      id: editDelivery.id,
      advertiser_id: data.advertiser_id,
      product_name: data.product_name,
      quantity: data.quantity,
      date_sent: format(data.date_sent, 'yyyy-MM-dd'),
      status: data.status,
      price: data.price,
      notes: data.notes,
    });
    setEditDelivery(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDelivery.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: ProductDeliveryStatus) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Sent</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Pending</Badge>;
      case 'returned':
        return <Badge variant="destructive">Returned</Badge>;
    }
  };

  const DeliveryFormFields = ({ formInstance, onSubmitFn, isSubmitting, submitLabel }: { 
    formInstance: typeof form; 
    onSubmitFn: (data: DeliveryFormData) => Promise<void>;
    isSubmitting: boolean;
    submitLabel: string;
  }) => (
    <Form {...formInstance}>
      <form onSubmit={formInstance.handleSubmit(onSubmitFn)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={formInstance.control}
            name="advertiser_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Celebrity / Influencer *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select celebrity" />
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
            control={formInstance.control}
            name="product_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="date_sent"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date Sent *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "MMM d, yyyy") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_DELIVERY_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Price *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0} 
                    step="0.01"
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={formInstance.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery</h1>
          <p className="mt-1 text-muted-foreground">Track product deliveries to celebrities and influencers</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="records">Delivery Records</TabsTrigger>
            {isAdmin && <TabsTrigger value="add">Add New Delivery</TabsTrigger>}
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            {/* Summary Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                    <DollarSign className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Delivery Price</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${totalDeliveryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by celebrity name or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Records Table */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Records</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : filteredDeliveries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'No matching deliveries found.' : 'No deliveries yet. Add your first delivery!'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Celebrity Name</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Date Sent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Notes</TableHead>
                          {isAdmin && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDeliveries.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell className="font-medium">
                              {delivery.advertiser?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>{delivery.product_name}</TableCell>
                            <TableCell>{delivery.quantity}</TableCell>
                            <TableCell>
                              {format(new Date(delivery.date_sent), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                            <TableCell>${Number(delivery.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{delivery.notes || '-'}</TableCell>
                            {isAdmin && (
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(delivery)}
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteId(delivery.id)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
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
                    Add New Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DeliveryFormFields 
                    formInstance={form}
                    onSubmitFn={onSubmit}
                    isSubmitting={createDelivery.isPending}
                    submitLabel="Add Delivery"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editDelivery} onOpenChange={(open) => !open && setEditDelivery(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Delivery</DialogTitle>
            </DialogHeader>
            <DeliveryFormFields 
              formInstance={editForm}
              onSubmitFn={onEditSubmit}
              isSubmitting={updateDelivery.isPending}
              submitLabel="Save Changes"
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Delivery</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this delivery record? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
