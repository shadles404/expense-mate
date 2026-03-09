import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useTikTokPaymentHistory } from '@/hooks/useTikTokPaymentHistory';
import { useTikTokSettings } from '@/hooks/useTikTokSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { useTikTokSectionPermissions } from '@/hooks/useModulePermissions';
import { Plus, Search, Download, Zap, Users, DollarSign, Clock, AlertTriangle, Archive, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { downloadCSV } from '@/lib/csvExport';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  pending: 'secondary',
  unpaid: 'secondary',
  suspended: 'destructive',
};

export default function TikTokPayments() {
  const { payments, auditLogs, isLoading, createPayment, updatePaymentStatus, autoAddEligible } = useTikTokPayments();
  const { influencers } = useTikTokAdvertisers();
  const { archivePayments } = useTikTokPaymentHistory();
  const { settings } = useTikTokSettings();
  const { isAdmin } = useUserRole();
  const { canWriteSection } = useTikTokSectionPermissions();
  const canWrite = canWriteSection('tiktok_payments');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditPaymentId, setAuditPaymentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    advertiser_id: '', amount: 0, campaign_month: '', total_target_videos: 0, completed_videos: 0, notes: '',
  });

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Detect eligible influencers (active, reached target, no payment this month)
  const activeInfluencers = influencers.filter(i => i.is_active);
  const eligibleCount = useMemo(() => {
    const existingThisMonth = payments.filter(p => p.campaign_month === currentMonth);
    return activeInfluencers.filter(i =>
      i.completed_videos >= i.target_videos &&
      i.target_videos > 0 &&
      !existingThisMonth.some(p => p.advertiser_id === i.id)
    ).length;
  }, [activeInfluencers, payments, currentMonth]);

  const availableMonths = useMemo(() => 
    [...new Set(payments.map(p => p.campaign_month).filter(Boolean))].sort().reverse()
  , [payments]);

  const selectedInfluencer = influencers.find(i => i.id === form.advertiser_id);

  const handleInfluencerSelect = (id: string) => {
    const inf = influencers.find(i => i.id === id);
    setForm({
      ...form,
      advertiser_id: id,
      total_target_videos: inf?.target_videos || 0,
      completed_videos: inf?.completed_videos || 0,
      amount: inf?.salary || 0,
    });
  };

  const handleSubmit = () => {
    if (!form.campaign_month) {
      toast({ title: 'Campaign month required', variant: 'destructive' });
      return;
    }
    const exists = payments.some(p => p.advertiser_id === form.advertiser_id && p.campaign_month === form.campaign_month);
    if (exists) {
      toast({ title: 'Duplicate detected', description: 'Payment already recorded for this influencer this month', variant: 'destructive' });
      return;
    }
    // Budget check
    const budget = settings?.monthly_influencer_budget || 0;
    if (budget > 0) {
      const currentTotal = payments.filter(p => p.campaign_month === form.campaign_month).reduce((s, p) => s + p.amount, 0);
      if (currentTotal + form.amount > budget) {
        if (!confirm(`⚠️ Budget Alert: Adding this payment ($${form.amount}) will exceed the monthly budget of $${budget.toFixed(2)} (current total: $${currentTotal.toFixed(2)}). Continue anyway?`)) {
          return;
        }
      }
    }
    createPayment.mutate({
      advertiser_id: form.advertiser_id,
      amount: form.amount,
      campaign_month: form.campaign_month,
      total_target_videos: form.total_target_videos,
      completed_videos: form.completed_videos,
      notes: form.notes || null,
      status: 'pending',
    });
    setDialogOpen(false);
    setForm({ advertiser_id: '', amount: 0, campaign_month: '', total_target_videos: 0, completed_videos: 0, notes: '' });
  };

  const handleAutoAdd = () => {
    autoAddEligible.mutate(activeInfluencers.map(i => ({
      id: i.id, name: i.name, target_videos: i.target_videos, completed_videos: i.completed_videos, salary: i.salary,
    })));
  };

  const handleStatusChange = (paymentId: string, newStatus: string) => {
    updatePaymentStatus.mutate({ id: paymentId, status: newStatus });
  };

  // Enrich payments with current salary from influencer profile
  const enrichedPayments = useMemo(() => payments.map(p => {
    const inf = influencers.find(i => i.id === p.advertiser_id);
    const correctAmount = inf?.salary ?? p.amount;
    return { ...p, amount: correctAmount };
  }), [payments, influencers]);

  const filtered = enrichedPayments.filter(p => {
    const matchSearch = (p.advertiser?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchMonth = filterMonth === 'all' || p.campaign_month === filterMonth;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchMonth && matchStatus;
  });

  // KPI calculations
  const monthPayments = payments.filter(p => p.campaign_month === currentMonth);
  const totalPaidThisMonth = monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const paidCount = monthPayments.filter(p => p.status === 'paid').length;
  const pendingAmount = payments.filter(p => p.status === 'pending' || p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
  const totalTarget = activeInfluencers.filter(i => i.target_videos > 0).length;
  const reachedTarget = activeInfluencers.filter(i => i.completed_videos >= i.target_videos && i.target_videos > 0).length;
  const completionRate = totalTarget > 0 ? Math.round((reachedTarget / totalTarget) * 100) : 0;

  // Budget check
  const paymentBudget = settings?.monthly_influencer_budget || 0;
  const currentMonthTotal = monthPayments.reduce((s, p) => s + p.amount, 0);
  const paymentOverBudget = paymentBudget > 0 && currentMonthTotal >= paymentBudget;

  const handleExportCSV = () => {
    downloadCSV(filtered.map(p => ({
      Influencer: p.advertiser?.name || '',
      Campaign: p.campaign_month || '',
      'Target Videos': p.total_target_videos,
      'Completed Videos': p.completed_videos,
      Amount: p.amount,
      Status: p.status,
      'Payment Date': p.payment_date || '',
    })), 'payments');
  };

  const paymentAuditLogs = auditPaymentId ? auditLogs.filter(l => l.payment_id === auditPaymentId) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Payment Confirmation</h1>
            {eligibleCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {eligibleCount} eligible
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />CSV
            </Button>
            {isAdmin && payments.length > 0 && (
              <Button variant="outline" onClick={() => {
                if (!confirm('Archive all current payments to history? This preserves records and clears the current list for the new month.')) return;
                archivePayments.mutate(payments.map(p => ({
                  advertiser_id: p.advertiser_id,
                  campaign_month: p.campaign_month || '',
                  total_target_videos: p.total_target_videos,
                  completed_videos: p.completed_videos,
                  amount: p.amount,
                  status: p.status,
                  payment_date: p.payment_date,
                })));
              }} disabled={archivePayments.isPending}>
                <Archive className="h-4 w-4 mr-2" />Archive & Reset
              </Button>
            )}
            {canWrite && eligibleCount > 0 && (
              <Button variant="secondary" onClick={handleAutoAdd} disabled={autoAddEligible.isPending}>
                <Zap className="h-4 w-4 mr-2" />Auto-Add {eligibleCount} Eligible
              </Button>
            )}
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
                          {activeInfluencers.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Campaign Month *</Label><Input type="month" value={form.campaign_month} onChange={e => setForm({ ...form, campaign_month: e.target.value })} /></div>
                    {selectedInfluencer && (
                      <div className="rounded-lg bg-muted p-4 space-y-2">
                        <div className="flex justify-between text-sm"><span>Target Videos:</span><span className="font-medium">{form.total_target_videos}</span></div>
                        <div className="flex justify-between text-sm"><span>Completed:</span><span className="font-medium">{form.completed_videos}</span></div>
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <Badge variant={form.completed_videos >= form.total_target_videos ? 'default' : 'destructive'}>
                            {form.completed_videos >= form.total_target_videos ? 'Target Reached' : 'Incomplete'}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                    <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                    <Button onClick={handleSubmit} disabled={!form.advertiser_id || !form.campaign_month} className="w-full">
                      Create Payment (Pending)
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Budget Alert */}
        {paymentOverBudget && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-destructive">Payment Budget Reached</p>
                <p className="text-sm text-muted-foreground">Current month total: ${currentMonthTotal.toFixed(2)} / Budget: ${paymentBudget.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid This Month</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${totalPaidThisMonth.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{paidCount} influencers paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Influencers Paid</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidCount}</div>
              <p className="text-xs text-muted-foreground mt-1">This month ({currentMonth})</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
              <Clock className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">${pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{payments.filter(p => p.status === 'pending' || p.status === 'unpaid').length} payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Target Completion</CardTitle>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">{reachedTarget}/{totalTarget} reached</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map(m => <SelectItem key={m} value={m!}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
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
                  {(canWrite || isAdmin) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.advertiser?.name || '—'}</TableCell>
                    <TableCell>{p.campaign_month || '—'}</TableCell>
                    <TableCell>{p.total_target_videos}</TableCell>
                    <TableCell>{p.completed_videos}</TableCell>
                    <TableCell>${p.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[p.status] || 'secondary'}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>{p.payment_date ? format(new Date(p.payment_date), 'MMM dd, yyyy') : '—'}</TableCell>
                    {(canWrite || isAdmin) && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <Select value={p.status} onValueChange={(val) => handleStatusChange(p.id, val)}>
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs"
                            onClick={() => { setAuditPaymentId(p.id); setAuditDialogOpen(true); }}
                          >
                            Log
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={(canWrite || isAdmin) ? 8 : 7} className="text-center text-muted-foreground py-8">{isLoading ? 'Loading...' : 'No payments found'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Audit Log Dialog */}
        <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Status Change History</DialogTitle></DialogHeader>
            {paymentAuditLogs.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {paymentAuditLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <span className="text-muted-foreground">{log.old_status || '—'}</span>
                      <span className="mx-2">→</span>
                      <Badge variant={STATUS_COLORS[log.new_status] || 'secondary'}>{log.new_status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No status changes recorded</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
