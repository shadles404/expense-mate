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
import { useTikTokPayments } from '@/hooks/useTikTokPayments';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useUserRole } from '@/hooks/useUserRole';
import { useTikTokSectionPermissions } from '@/hooks/useModulePermissions';
import { Plus, CheckCircle, Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { downloadCSV } from '@/lib/csvExport';

export default function TikTokPayments() {
  const { payments, isLoading, createPayment, updatePayment } = useTikTokPayments();
  const { influencers } = useTikTokAdvertisers();
  const { isAdmin } = useUserRole();
  const { canWriteSection } = useTikTokSectionPermissions();
  const canWrite = canWriteSection('tiktok_payments');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    advertiser_id: '', amount: 0, campaign_month: '', total_target_videos: 0, completed_videos: 0, notes: '',
  });

  const selectedInfluencer = influencers.find((i) => i.id === form.advertiser_id);

  const handleInfluencerSelect = (id: string) => {
    const inf = influencers.find((i) => i.id === id);
    setForm({
      ...form,
      advertiser_id: id,
      total_target_videos: inf?.target_videos || 0,
      completed_videos: inf?.completed_videos || 0,
      amount: inf?.salary || 0,
    });
  };

  const handleSubmit = () => {
    if (form.completed_videos < form.total_target_videos) {
      toast({ title: 'Cannot confirm payment', description: 'Influencer has not completed all target videos.', variant: 'destructive' });
      return;
    }
    createPayment.mutate({
      advertiser_id: form.advertiser_id,
      amount: form.amount,
      campaign_month: form.campaign_month || null,
      total_target_videos: form.total_target_videos,
      completed_videos: form.completed_videos,
      notes: form.notes || null,
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
    });
    setDialogOpen(false);
    setForm({ advertiser_id: '', amount: 0, campaign_month: '', total_target_videos: 0, completed_videos: 0, notes: '' });
  };

  const confirmPayment = (id: string) => {
    updatePayment.mutate({ id, status: 'paid', payment_date: new Date().toISOString().split('T')[0] });
  };

  const filtered = payments.filter((p) =>
    (p.advertiser?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.campaign_month || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    downloadCSV(filtered.map((p) => ({
      Influencer: p.advertiser?.name || '',
      Campaign: p.campaign_month || '',
      'Target Videos': p.total_target_videos,
      'Completed Videos': p.completed_videos,
      Amount: p.amount,
      Status: p.status,
      'Payment Date': p.payment_date || '',
    })), 'payments');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Payment Confirmation</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />CSV
            </Button>
            {canWrite && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />New Payment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Payment</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Influencer *</Label>
                      <Select value={form.advertiser_id} onValueChange={handleInfluencerSelect}>
                        <SelectTrigger><SelectValue placeholder="Select influencer" /></SelectTrigger>
                        <SelectContent>
                          {influencers.filter((i) => i.is_active).map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Campaign Month</Label><Input type="month" value={form.campaign_month} onChange={(e) => setForm({ ...form, campaign_month: e.target.value })} /></div>
                    {selectedInfluencer && (
                      <div className="rounded-lg bg-muted p-4 space-y-2">
                        <div className="flex justify-between text-sm"><span>Target Videos:</span><span className="font-medium">{form.total_target_videos}</span></div>
                        <div className="flex justify-between text-sm"><span>Completed:</span><span className="font-medium">{form.completed_videos}</span></div>
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <Badge variant={form.completed_videos >= form.total_target_videos ? 'default' : 'destructive'}>
                            {form.completed_videos >= form.total_target_videos ? 'Target Reached — Auto Confirmed' : 'Incomplete'}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                    <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                    <Button onClick={handleSubmit} disabled={!form.advertiser_id || form.completed_videos < form.total_target_videos} className="w-full">
                      Create & Auto-Confirm Payment
                    </Button>
                    {form.advertiser_id && form.completed_videos < form.total_target_videos && (
                      <p className="text-xs text-destructive text-center">Payment can only be created when targets are completed</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {canWrite && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.advertiser?.name || '—'}</TableCell>
                    <TableCell>{p.campaign_month || '—'}</TableCell>
                    <TableCell>{p.total_target_videos}</TableCell>
                    <TableCell>{p.completed_videos}</TableCell>
                    <TableCell>${p.amount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                    <TableCell>{p.payment_date ? format(new Date(p.payment_date), 'MMM dd, yyyy') : '—'}</TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        {p.status === 'unpaid' && isAdmin && (
                          <Button size="sm" variant="outline" onClick={() => confirmPayment(p.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />Override
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={canWrite ? 8 : 7} className="text-center text-muted-foreground py-8">{isLoading ? 'Loading...' : 'No payments found'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
