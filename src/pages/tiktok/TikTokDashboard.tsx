import { useMemo } from 'react';
import { Users, DollarSign, Video, TrendingUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#10b981', '#f59e0b'];

export default function TikTokDashboard() {
  const { advertisers, isLoading } = useTikTokAdvertisers();

  const stats = useMemo(() => {
    const totalTeamMembers = advertisers.length;
    const totalSalaryBudget = advertisers.reduce((sum, a) => sum + a.salary, 0);
    const totalTargetVideos = advertisers.reduce((sum, a) => sum + a.target_videos, 0);
    const totalCompletedVideos = advertisers.reduce((sum, a) => sum + a.completed_videos, 0);
    const completionRate = totalTargetVideos > 0 ? (totalCompletedVideos / totalTargetVideos) * 100 : 0;

    return { totalTeamMembers, totalSalaryBudget, totalTargetVideos, totalCompletedVideos, completionRate };
  }, [advertisers]);

  const adTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    advertisers.forEach(a => {
      a.ad_types.forEach(type => {
        counts[type] = (counts[type] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [advertisers]);

  const memberProgressData = useMemo(() => {
    return advertisers.slice(0, 10).map(a => ({
      name: a.name.length > 12 ? a.name.slice(0, 12) + '...' : a.name,
      completed: a.completed_videos,
      target: a.target_videos,
    }));
  }, [advertisers]);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">TikTok Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Overview of your TikTok advertising team</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : (
            <>
              <StatCard
                title="Total Team Members"
                value={stats.totalTeamMembers}
                subtitle="Active advertisers"
                icon={<Users className="h-6 w-6" />}
              />
              <StatCard
                title="Total Salary Budget"
                value={`$${stats.totalSalaryBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                subtitle="Monthly budget"
                icon={<DollarSign className="h-6 w-6" />}
                iconClassName="gradient-success"
              />
              <StatCard
                title="Videos Completed"
                value={`${stats.totalCompletedVideos} of ${stats.totalTargetVideos}`}
                subtitle="Total progress"
                icon={<Video className="h-6 w-6" />}
                iconClassName="gradient-primary"
              />
              <StatCard
                title="Completion Rate"
                value={`${stats.completionRate.toFixed(1)}%`}
                subtitle="Overall performance"
                icon={<TrendingUp className="h-6 w-6" />}
                iconClassName={stats.completionRate >= 80 ? "gradient-success" : stats.completionRate >= 50 ? "gradient-primary" : "gradient-danger"}
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ads by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {adTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={adTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {adTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Completion by Member</CardTitle>
            </CardHeader>
            <CardContent>
              {memberProgressData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={memberProgressData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" />
                    <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
