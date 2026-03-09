import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useTikTokProductDeliveries } from '@/hooks/useTikTokProductDeliveries';
import { useTikTokPayments } from '@/hooks/useTikTokPayments';
import { useTikTokSettings } from '@/hooks/useTikTokSettings';
import { useContractNotifications } from '@/hooks/useContractNotifications';
import { ContractAlerts } from '@/components/tiktok/ContractAlerts';
import { Users, Video, Package, DollarSign, TrendingUp, TrendingDown, Wallet, Clock, Download, Percent, AlertTriangle, UserX, UserCheck, ShieldAlert } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { downloadCSV } from '@/lib/csvExport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent-foreground))'];

export default function TikTokDashboard() {
  const { influencers } = useTikTokAdvertisers();
  const { productDeliveries } = useTikTokProductDeliveries();
  const { payments } = useTikTokPayments();
  const { settings } = useTikTokSettings();
  const { notifications, expiringCount } = useContractNotifications(influencers);

  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const availableMonths = useMemo(() =>
    [...new Set(payments.map(p => p.campaign_month).filter(Boolean))].sort().reverse()
  , [payments]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const filteredPayments = useMemo(() => payments.filter(p => {
    const matchMonth = filterMonth === 'all' || p.campaign_month === filterMonth;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchMonth && matchStatus;
  }), [payments, filterMonth, filterStatus]);

  // Only active influencers for stats
  const active = influencers.filter(i => i.is_active);
  const totalInfluencers = influencers.length;
  const activeInfluencers = active.length;
  const inactiveInfluencers = totalInfluencers - activeInfluencers;
  const totalTargetVideos = active.reduce((s, i) => s + i.target_videos, 0);
  const totalCompletedVideos = active.reduce((s, i) => s + i.completed_videos, 0);
  const deliveredProducts = productDeliveries.filter(d => d.status === 'sent').length;
  const pendingProducts = productDeliveries.filter(d => d.status === 'pending').length;
  const reachedTarget = active.filter(i => i.completed_videos >= i.target_videos && i.target_videos > 0).length;
  const unreachedTarget = active.filter(i => i.completed_videos < i.target_videos && i.target_videos > 0).length;
  const totalWithTarget = active.filter(i => i.target_videos > 0).length;
  const completionRate = totalWithTarget > 0 ? Math.round((reachedTarget / totalWithTarget) * 100) : 0;

  // Financial stats
  const totalPaid = filteredPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = filteredPayments.filter(p => p.status === 'pending' || p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
  const suspendedCount = filteredPayments.filter(p => p.status === 'suspended').length;
  const suspendedAmount = filteredPayments.filter(p => p.status === 'suspended').reduce((s, p) => s + p.amount, 0);
  const monthlyPaid = payments.filter(p => p.status === 'paid' && p.campaign_month === currentMonth).reduce((s, p) => s + p.amount, 0);
  const paidThisMonthCount = payments.filter(p => p.status === 'paid' && p.campaign_month === currentMonth).length;

  // Budget calculations
  const paymentBudget = settings?.monthly_influencer_budget || 0;
  const deliveryBudget = settings?.delivery_budget || 0;
  const activeDeliveries = productDeliveries.filter(d => {
    const inf = influencers.find(i => i.id === d.advertiser_id);
    return inf?.is_active;
  });
  const currentMonthDeliveryTotal = activeDeliveries
    .filter(d => d.date_sent.startsWith(currentMonth))
    .reduce((s, d) => s + d.price * d.quantity, 0);
  const currentMonthPaymentTotal = payments
    .filter(p => p.campaign_month === currentMonth)
    .reduce((s, p) => s + p.amount, 0);
  const paymentBudgetPct = paymentBudget > 0 ? Math.min(100, (currentMonthPaymentTotal / paymentBudget) * 100) : 0;
  const deliveryBudgetPct = deliveryBudget > 0 ? Math.min(100, (currentMonthDeliveryTotal / deliveryBudget) * 100) : 0;
  const paymentOverBudget = paymentBudget > 0 && currentMonthPaymentTotal >= paymentBudget;
  const deliveryOverBudget = deliveryBudget > 0 && currentMonthDeliveryTotal >= deliveryBudget;

  const monthlyTrend = useMemo(() => {
    const months = [...new Set(payments.map(p => p.campaign_month).filter(Boolean))].sort();
    return months.map(m => ({
      month: m!,
      paid: payments.filter(p => p.campaign_month === m && p.status === 'paid').reduce((s, p) => s + p.amount, 0),
      pending: payments.filter(p => p.campaign_month === m && (p.status === 'pending' || p.status === 'unpaid')).reduce((s, p) => s + p.amount, 0),
    }));
  }, [payments]);

  const performanceData = [
    { name: 'Reached', value: reachedTarget },
    { name: 'Unreached', value: unreachedTarget },
  ];

  const chartConfig = {
    value: { label: 'Count', color: 'hsl(var(--primary))' },
    count: { label: 'Count', color: 'hsl(var(--primary))' },
    paid: { label: 'Paid', color: 'hsl(var(--primary))' },
    pending: { label: 'Pending', color: 'hsl(var(--destructive))' },
  };

  const handleExportCSV = () => {
    downloadCSV(filteredPayments.map(p => ({
      Influencer: p.advertiser?.name || '',
      Campaign: p.campaign_month || '',
      Amount: p.amount,
      Status: p.status,
      Date: p.payment_date || '',
    })), 'tiktok-dashboard-export');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('TikTok Dashboard Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    autoTable(doc, {
      startY: 46,
      head: [['Metric', 'Value']],
      body: [
        ['Total Influencers', String(totalInfluencers)],
        ['Active Influencers', String(activeInfluencers)],
        ['Inactive Influencers', String(inactiveInfluencers)],
        ['Contracts Expiring Soon', String(expiringCount)],
        ['Target Completion Rate', `${completionRate}%`],
        ['Total Paid', `$${totalPaid.toFixed(2)}`],
        ['Pending Payments', `$${totalPending.toFixed(2)}`],
        ['Suspended Payments', `$${suspendedAmount.toFixed(2)} (${suspendedCount})`],
        ['This Month Paid', `$${monthlyPaid.toFixed(2)}`],
      ],
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Payment Details', 14, finalY);
    autoTable(doc, {
      startY: finalY + 4,
      head: [['Influencer', 'Campaign', 'Amount', 'Status']],
      body: filteredPayments.map(p => [
        p.advertiser?.name || '',
        p.campaign_month || '',
        `$${p.amount.toFixed(2)}`,
        p.status,
      ]),
    });
    doc.save('tiktok-dashboard-report.pdf');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-foreground">TikTok Dashboard</h1>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Months" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map(m => <SelectItem key={m} value={m!}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />CSV</Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
          </div>
        </div>

        {/* Contract Expiry Alerts */}
        {notifications.length > 0 && <ContractAlerts notifications={notifications} />}

        {/* Influencer Overview */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Influencer Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Influencers</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInfluencers}</div>
                <p className="text-xs text-muted-foreground mt-1">{activeInfluencers} active / {inactiveInfluencers} inactive</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Influencers</CardTitle>
                <UserCheck className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{activeInfluencers}</div>
                <p className="text-xs text-muted-foreground mt-1">Contributing to campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Influencers</CardTitle>
                <UserX className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inactiveInfluencers}</div>
                <p className="text-xs text-muted-foreground mt-1">Excluded from tracking</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contracts Expiring</CardTitle>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expiringCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Overview */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Payment Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid This Month</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${monthlyPaid.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{paidThisMonthCount} influencers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Paid Influencers</CardTitle>
                <UserCheck className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paidThisMonthCount}</div>
                <p className="text-xs text-muted-foreground mt-1">This month ({currentMonth})</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
                <Clock className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">${totalPending.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{filteredPayments.filter(p => p.status === 'pending' || p.status === 'unpaid').length} payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Suspended Payments</CardTitle>
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${suspendedAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{suspendedCount} suspended</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Target Completion */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Target Videos</CardTitle>
              <Video className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompletedVideos} / {totalTargetVideos}</div>
              <p className="text-xs text-muted-foreground mt-1">{totalTargetVideos - totalCompletedVideos} remaining (active only)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
              <Percent className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">{reachedTarget}/{totalWithTarget} reached target</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Product Deliveries</CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productDeliveries.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{deliveredProducts} delivered / {pendingProducts} pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Monthly Payment Trend</CardTitle></CardHeader>
            <CardContent>
              {monthlyTrend.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <BarChart data={monthlyTrend}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Bar dataKey="paid" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">No payment data yet</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Influencer Performance</CardTitle></CardHeader>
            <CardContent>
              {performanceData.some(d => d.value > 0) ? (
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <PieChart>
                    <Pie data={performanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {performanceData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">No data yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top/Bottom Performers (active only) */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {active
                  .filter(i => i.target_videos > 0)
                  .sort((a, b) => (b.completed_videos / b.target_videos) - (a.completed_videos / a.target_videos))
                  .slice(0, 5)
                  .map(i => (
                    <div key={i.id} className="flex items-center justify-between">
                      <span className="font-medium text-sm">{i.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{i.completed_videos}/{i.target_videos}</span>
                        {i.completed_videos >= i.target_videos && <Badge variant="default">✓</Badge>}
                      </div>
                    </div>
                  ))}
                {active.length === 0 && <p className="text-sm text-muted-foreground">No active influencers</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Needs Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {active
                  .filter(i => i.target_videos > 0 && i.completed_videos < i.target_videos)
                  .sort((a, b) => (a.completed_videos / a.target_videos) - (b.completed_videos / b.target_videos))
                  .slice(0, 5)
                  .map(i => (
                    <div key={i.id} className="flex items-center justify-between">
                      <span className="font-medium text-sm">{i.name}</span>
                      <span className="text-sm text-destructive">{i.target_videos - i.completed_videos} remaining</span>
                    </div>
                  ))}
                {active.filter(i => i.completed_videos < i.target_videos).length === 0 && (
                  <p className="text-sm text-muted-foreground">All targets met!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
