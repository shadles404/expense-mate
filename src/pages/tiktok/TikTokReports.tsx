import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useTikTokProductDeliveries } from '@/hooks/useTikTokProductDeliveries';
import { useTikTokPayments } from '@/hooks/useTikTokPayments';
import { useTikTokMonthlyReports } from '@/hooks/useTikTokMonthlyReports';
import { useAuth } from '@/hooks/useAuth';
import { useTikTokSectionPermissions } from '@/hooks/useModulePermissions';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Download, Save } from 'lucide-react';
import { downloadCSV } from '@/lib/csvExport';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function TikTokReports() {
  const { user } = useAuth();
  const { influencers } = useTikTokAdvertisers();
  const { productDeliveries } = useTikTokProductDeliveries();
  const { payments } = useTikTokPayments();
  const { reports, saveReport } = useTikTokMonthlyReports();
  const { canWriteSection } = useTikTokSectionPermissions();
  const canWrite = canWriteSection('tiktok_reports');
  const [filterInfluencer, setFilterInfluencer] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  const chartConfig = { count: { label: 'Count', color: 'hsl(var(--primary))' } };

  // Generate available months from data
  const availableMonths = [...new Set([
    ...payments.map((p) => p.campaign_month).filter(Boolean),
    ...reports.map((r) => r.report_month),
  ])].sort().reverse();

  // Performance data
  const performanceData = influencers
    .filter((i) => filterInfluencer === 'all' || i.id === filterInfluencer)
    .map((i) => ({
      name: i.name.length > 12 ? i.name.substring(0, 12) + '...' : i.name,
      target: i.target_videos,
      completed: i.completed_videos,
    }));

  // Delivery summary
  const deliveryByInfluencer = influencers
    .filter((i) => filterInfluencer === 'all' || i.id === filterInfluencer)
    .map((i) => {
      const dels = productDeliveries.filter((d) => d.advertiser_id === i.id);
      return {
        name: i.name,
        total: dels.length,
        pending: dels.filter((d) => d.status === 'pending').length,
        delivered: dels.filter((d) => d.status === 'sent').length,
        returned: dels.filter((d) => d.status === 'returned').length,
        totalValue: dels.reduce((s, d) => s + d.price * d.quantity, 0),
      };
    });

  // Payment summary
  const paymentByInfluencer = influencers
    .filter((i) => filterInfluencer === 'all' || i.id === filterInfluencer)
    .map((i) => {
      const pays = payments.filter((p) => p.advertiser_id === i.id && (filterMonth === 'all' || p.campaign_month === filterMonth));
      return {
        name: i.name,
        total: pays.reduce((s, p) => s + p.amount, 0),
        paid: pays.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
        unpaid: pays.filter((p) => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0),
      };
    });

  const handleSaveMonthlyReport = () => {
    if (!user) return;
    const month = new Date().toISOString().slice(0, 7);
    const reached = influencers.filter((i) => i.completed_videos >= i.target_videos && i.target_videos > 0).length;
    const unreached = influencers.filter((i) => i.completed_videos < i.target_videos && i.target_videos > 0).length;
    const paidTotal = payments.filter((p) => p.status === 'paid' && (p.campaign_month === month || p.payment_date?.startsWith(month))).reduce((s, p) => s + p.amount, 0);
    const pendingTotal = payments.filter((p) => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);

    saveReport.mutate({
      user_id: user.id,
      report_month: month,
      total_influencers: influencers.length,
      active_influencers: influencers.filter((i) => i.is_active).length,
      total_target_videos: influencers.reduce((s, i) => s + i.target_videos, 0),
      total_completed_videos: influencers.reduce((s, i) => s + i.completed_videos, 0),
      reached_target: reached,
      unreached_target: unreached,
      total_payments_made: paidTotal,
      total_payments_pending: pendingTotal,
      total_deliveries: productDeliveries.length,
      report_data: {
        influencers: influencers.map((i) => ({ name: i.name, target: i.target_videos, completed: i.completed_videos, status: i.completed_videos >= i.target_videos ? 'reached' : 'unreached' })),
      },
    });
  };

  const handleExportPerformance = () => {
    downloadCSV(influencers.filter((i) => filterInfluencer === 'all' || i.id === filterInfluencer).map((i) => ({
      Influencer: i.name, Target: i.target_videos, Completed: i.completed_videos,
      Remaining: Math.max(0, i.target_videos - i.completed_videos),
      Status: i.completed_videos >= i.target_videos ? 'Reached' : 'Unreached',
    })), 'performance-report');
  };

  const handleExportDelivery = () => {
    downloadCSV(deliveryByInfluencer.map((d) => ({
      Influencer: d.name, Total: d.total, Pending: d.pending, Delivered: d.delivered, Returned: d.returned, 'Total Value': d.totalValue,
    })), 'delivery-report');
  };

  const handleExportPayment = () => {
    downloadCSV(paymentByInfluencer.map((p) => ({
      Influencer: p.name, Total: p.total, Paid: p.paid, Unpaid: p.unpaid,
    })), 'payment-report');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Months" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map((m) => <SelectItem key={m} value={m!}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterInfluencer} onValueChange={setFilterInfluencer}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Influencers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Influencers</SelectItem>
                {influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {canWrite && (
              <Button variant="outline" onClick={handleSaveMonthlyReport}>
                <Save className="h-4 w-4 mr-2" />Save Monthly Snapshot
              </Button>
            )}
          </div>
        </div>

        {/* Saved Monthly Reports */}
        {reports.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Saved Monthly Reports</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Influencers</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Reached</TableHead>
                    <TableHead>Unreached</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.report_month}</TableCell>
                      <TableCell>{r.total_influencers} ({r.active_influencers} active)</TableCell>
                      <TableCell>{r.total_target_videos}</TableCell>
                      <TableCell>{r.total_completed_videos}</TableCell>
                      <TableCell><Badge variant="default">{r.reached_target}</Badge></TableCell>
                      <TableCell><Badge variant="destructive">{r.unreached_target}</Badge></TableCell>
                      <TableCell className="text-primary">${Number(r.total_payments_made).toFixed(2)}</TableCell>
                      <TableCell className="text-destructive">${Number(r.total_payments_pending).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="delivery">Deliveries</TabsTrigger>
            <TabsTrigger value="payment">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportPerformance}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </div>
            <Card>
              <CardHeader><CardTitle>Target vs Completed Videos</CardTitle></CardHeader>
              <CardContent>
                {performanceData.length > 0 ? (
                  <ChartContainer config={{ target: { label: 'Target', color: 'hsl(var(--muted-foreground))' }, completed: { label: 'Completed', color: 'hsl(var(--primary))' } }} className="h-[300px]">
                    <BarChart data={performanceData}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Bar dataKey="target" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </BarChart>
                  </ChartContainer>
                ) : <p className="text-center text-muted-foreground py-8">No data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {influencers.filter((i) => filterInfluencer === 'all' || i.id === filterInfluencer).map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.name}</TableCell>
                        <TableCell>{i.target_videos}</TableCell>
                        <TableCell>{i.completed_videos}</TableCell>
                        <TableCell>{Math.max(0, i.target_videos - i.completed_videos)}</TableCell>
                        <TableCell>
                          <Badge variant={i.completed_videos >= i.target_videos ? 'default' : 'destructive'}>
                            {i.completed_videos >= i.target_videos ? 'Reached' : 'Unreached'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery">
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={handleExportDelivery}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Returned</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryByInfluencer.map((d) => (
                      <TableRow key={d.name}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.total}</TableCell>
                        <TableCell>{d.pending}</TableCell>
                        <TableCell>{d.delivered}</TableCell>
                        <TableCell>{d.returned}</TableCell>
                        <TableCell>${d.totalValue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {deliveryByInfluencer.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={handleExportPayment}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Unpaid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentByInfluencer.map((p) => (
                      <TableRow key={p.name}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>${p.total.toFixed(2)}</TableCell>
                        <TableCell className="text-primary">${p.paid.toFixed(2)}</TableCell>
                        <TableCell className="text-destructive">${p.unpaid.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {paymentByInfluencer.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
