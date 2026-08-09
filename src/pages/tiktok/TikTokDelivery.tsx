import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTikTokProductDeliveries } from '@/hooks/useTikTokProductDeliveries';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useTikTokSettings } from '@/hooks/useTikTokSettings';
import { useTikTokSectionPermissions } from '@/hooks/useModulePermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { Plus, Search, Pencil, Download, DollarSign, Clock, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { downloadCSV } from '@/lib/csvExport';
import { TikTokDeliveryInvoiceDialog } from '@/components/tiktok/TikTokDeliveryInvoiceDialog';
import type { TikTokProductDelivery } from '@/types/tiktok';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary', sent: 'default', returned: 'destructive',
};

const PAYMENT_STATUS_COLORS: Record<string, 'default' | 'secondary'> = {
  paid: 'default', unpaid: 'secondary',
};

export default function TikTokDelivery() {
  const { productDeliveries, isLoading, createProductDelivery, updateProductDelivery } = useTikTokProductDeliveries();
  const { influencers } = useTikTokAdvertisers();
  const { settings } = useTikTokSettings();
  const { canWriteSection } = useTikTokSectionPermissions();
  const { isAdmin } = useUserRole();
  const canWrite = canWriteSection('tiktok_delivery');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TikTokProductDelivery | null>(null);
  const [search, setSearch] = useState('');
  const [filterInfluencer, setFilterInfluencer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [form, setForm] = useState({
    advertiser_id: '', product_name: '', quantity: 1, date_sent: new Date().toISOString().split('T')[0],
    status: 'pending' as 'pending' | 'sent' | 'returned', price: 0, notes: '', payment_status: 'unpaid' as 'paid' | 'unpaid',
  });

  const resetForm = () => {
    setForm({ advertiser_id: '', product_name: '', quantity: 1, date_sent: new Date().toISOString().split('T')[0], status: 'pending', price: 0, notes: '', payment_status: 'unpaid' });
    setEditing(null);
  };

  const openEdit = (d: TikTokProductDelivery) => {
    setEditing(d);
    setForm({
      advertiser_id: d.advertiser_id, product_name: d.product_name, quantity: d.quantity,
      date_sent: d.date_sent, status: d.status, price: d.price, notes: d.notes || '',
      payment_status: (d as any).payment_status || 'unpaid',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      advertiser_id: form.advertiser_id, product_name: form.product_name, quantity: form.quantity,
      date_sent: form.date_sent, status: form.status, price: form.price, notes: form.notes || null,
      payment_status: form.payment_status,
    };
    // Budget check for new deliveries
    const budget = settings?.delivery_budget || 0;
    const newValue = form.price * form.quantity;
    if (budget > 0 && !editing) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentTotal = productDeliveries
        .filter(d => d.date_sent.startsWith(currentMonth))
        .reduce((s, d) => s + d.price * d.quantity, 0);
      if (currentTotal + newValue > budget) {
        if (!confirm(`⚠️ Budget Alert: Adding this delivery ($${newValue.toFixed(2)}) will exceed the delivery budget of $${budget.toFixed(2)} (current total: $${currentTotal.toFixed(2)}). Continue anyway?`)) {
          return;
        }
      }
    }
    if (editing) {
      updateProductDelivery.mutate({ id: editing.id, ...payload });
    } else {
      createProductDelivery.mutate(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const filtered = productDeliveries.filter((d) => {
    const matchSearch = d.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.advertiser?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchInfluencer = filterInfluencer === 'all' || d.advertiser_id === filterInfluencer;
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchDateFrom = !filterDateFrom || d.date_sent >= filterDateFrom;
    const matchDateTo = !filterDateTo || d.date_sent <= filterDateTo;
    return matchSearch && matchInfluencer && matchStatus && matchDateFrom && matchDateTo;
  });

  // Payment status summary
  const paidDeliveries = filtered.filter(d => (d as any).payment_status === 'paid');
  const unpaidDeliveries = filtered.filter(d => (d as any).payment_status !== 'paid');
  const totalPaidAmount = paidDeliveries.reduce((sum, d) => sum + d.price * d.quantity, 0);
  const totalPendingAmount = unpaidDeliveries.reduce((sum, d) => sum + d.price * d.quantity, 0);

  // Delivery budget check
  const deliveryBudget = settings?.delivery_budget || 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTotal = productDeliveries
    .filter(d => d.date_sent.startsWith(currentMonth))
    .reduce((s, d) => s + d.price * d.quantity, 0);
  const deliveryOverBudget = deliveryBudget > 0 && currentMonthTotal >= deliveryBudget;

  const handleExportCSV = () => {
    downloadCSV(filtered.map((d) => ({
      Influencer: d.advertiser?.name || '',
      Product: d.product_name,
      Quantity: d.quantity,
      Date: d.date_sent,
      Price: d.price,
      Status: d.status,
      'Payment Status': (d as any).payment_status || 'unpaid',
      Notes: d.notes || '',
    })), 'delivery-records');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Delivery Records</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />CSV
            </Button>
            {canWrite && (
              <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />New Delivery</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editing ? 'Edit Delivery' : 'Register Delivery'}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Influencer *</Label>
                      <Select value={form.advertiser_id} onValueChange={(v) => setForm({ ...form, advertiser_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select influencer" /></SelectTrigger>
                        <SelectContent>
                          {influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Product Name *</Label><Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} /></div>
                      <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Date Sent</Label><Input type="date" value={form.date_sent} onChange={(e) => setForm({ ...form, date_sent: e.target.value })} /></div>
                      <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="sent">Delivered</SelectItem>
                            <SelectItem value="returned">Returned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(isAdmin || editing) && (
                        <div>
                          <Label>Payment Status</Label>
                          <Select value={form.payment_status} onValueChange={(v: any) => setForm({ ...form, payment_status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                    <Button onClick={handleSubmit} disabled={!form.advertiser_id || !form.product_name} className="w-full">{editing ? 'Update' : 'Register'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Budget Alert */}
        {deliveryOverBudget && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-destructive">Delivery Budget Reached</p>
                <p className="text-sm text-muted-foreground">Current month total: ${currentMonthTotal.toFixed(2)} / Budget: ${deliveryBudget.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Paid Deliveries</span>
              <span className="text-2xl font-bold text-primary">{paidDeliveries.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Unpaid Deliveries</span>
              <span className="text-2xl font-bold text-destructive">{unpaidDeliveries.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Paid</span>
              </div>
              <span className="text-2xl font-bold text-primary">${totalPaidAmount.toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Pending Amount</span>
              </div>
              <span className="text-2xl font-bold text-destructive">${totalPendingAmount.toFixed(2)}</span>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterInfluencer} onValueChange={setFilterInfluencer}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Influencer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Influencers</SelectItem>
              {influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Delivered</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-[150px]" placeholder="From" />
          <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-[150px]" placeholder="To" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  {canWrite && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.advertiser?.name || '—'}</TableCell>
                    <TableCell>{d.product_name}</TableCell>
                    <TableCell>{d.quantity}</TableCell>
                    <TableCell>{format(new Date(d.date_sent), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>${d.price.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={STATUS_COLORS[d.status]}>{d.status}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={PAYMENT_STATUS_COLORS[(d as any).payment_status] || 'secondary'}>
                        {(d as any).payment_status || 'unpaid'}
                      </Badge>
                    </TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={canWrite ? 8 : 7} className="text-center text-muted-foreground py-8">{isLoading ? 'Loading...' : 'No deliveries found'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
