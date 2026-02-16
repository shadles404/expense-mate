import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useTikTokProductDeliveries } from '@/hooks/useTikTokProductDeliveries';
import { useTikTokPayments } from '@/hooks/useTikTokPayments';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function TikTokReports() {
  const { influencers } = useTikTokAdvertisers();
  const { productDeliveries } = useTikTokProductDeliveries();
  const { payments } = useTikTokPayments();
  const [filterInfluencer, setFilterInfluencer] = useState('all');

  const chartConfig = { count: { label: 'Count', color: 'hsl(var(--primary))' } };

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
      const pays = payments.filter((p) => p.advertiser_id === i.id);
      return {
        name: i.name,
        total: pays.reduce((s, p) => s + p.amount, 0),
        paid: pays.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
        unpaid: pays.filter((p) => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0),
      };
    });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <Select value={filterInfluencer} onValueChange={setFilterInfluencer}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Influencers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Influencers</SelectItem>
              {influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="delivery">Deliveries</TabsTrigger>
            <TabsTrigger value="payment">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
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
