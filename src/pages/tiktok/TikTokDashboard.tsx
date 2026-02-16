import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useTikTokProductDeliveries } from '@/hooks/useTikTokProductDeliveries';
import { useTikTokDeliveries } from '@/hooks/useTikTokDeliveries';
import { useTikTokPayments } from '@/hooks/useTikTokPayments';
import { Users, Video, Package, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent-foreground))'];

export default function TikTokDashboard() {
  const { influencers } = useTikTokAdvertisers();
  const { productDeliveries } = useTikTokProductDeliveries();
  const { deliveries } = useTikTokDeliveries();
  const { payments } = useTikTokPayments();

  const totalInfluencers = influencers.length;
  const activeInfluencers = influencers.filter((i) => i.is_active).length;
  const inactiveInfluencers = totalInfluencers - activeInfluencers;
  const totalTargetVideos = influencers.reduce((s, i) => s + i.target_videos, 0);
  const totalCompletedVideos = influencers.reduce((s, i) => s + i.completed_videos, 0);
  const deliveredProducts = productDeliveries.filter((d) => d.status === 'sent').length;
  const pendingProducts = productDeliveries.filter((d) => d.status === 'pending').length;
  const reachedTarget = influencers.filter((i) => i.completed_videos >= i.target_videos && i.target_videos > 0).length;
  const unreachedTarget = influencers.filter((i) => i.completed_videos < i.target_videos && i.target_videos > 0).length;

  const performanceData = [
    { name: 'Reached', value: reachedTarget },
    { name: 'Unreached', value: unreachedTarget },
  ];

  const statusData = [
    { name: 'Active', count: activeInfluencers },
    { name: 'Inactive', count: inactiveInfluencers },
  ];

  const chartConfig = {
    value: { label: 'Count', color: 'hsl(var(--primary))' },
    count: { label: 'Count', color: 'hsl(var(--primary))' },
  };

  const stats = [
    { title: 'Total Influencers', value: totalInfluencers, icon: Users, sub: `${activeInfluencers} active / ${inactiveInfluencers} inactive` },
    { title: 'Target Videos', value: `${totalCompletedVideos} / ${totalTargetVideos}`, icon: Video, sub: `${totalTargetVideos - totalCompletedVideos} remaining` },
    { title: 'Product Deliveries', value: productDeliveries.length, icon: Package, sub: `${deliveredProducts} delivered / ${pendingProducts} pending` },
    { title: 'Payments', value: payments.length, icon: DollarSign, sub: `${payments.filter((p) => p.status === 'paid').length} paid` },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">TikTok Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Target Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.some((d) => d.value > 0) ? (
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Influencer Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {influencers
                  .filter((i) => i.target_videos > 0)
                  .sort((a, b) => (b.completed_videos / b.target_videos) - (a.completed_videos / a.target_videos))
                  .slice(0, 5)
                  .map((i) => (
                    <div key={i.id} className="flex items-center justify-between">
                      <span className="font-medium text-sm">{i.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {i.completed_videos}/{i.target_videos} videos
                      </span>
                    </div>
                  ))}
                {influencers.length === 0 && <p className="text-sm text-muted-foreground">No influencers registered</p>}
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
                {influencers
                  .filter((i) => i.target_videos > 0 && i.completed_videos < i.target_videos)
                  .sort((a, b) => (a.completed_videos / a.target_videos) - (b.completed_videos / b.target_videos))
                  .slice(0, 5)
                  .map((i) => (
                    <div key={i.id} className="flex items-center justify-between">
                      <span className="font-medium text-sm">{i.name}</span>
                      <span className="text-sm text-destructive">
                        {i.target_videos - i.completed_videos} remaining
                      </span>
                    </div>
                  ))}
                {influencers.filter((i) => i.completed_videos < i.target_videos).length === 0 && (
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
