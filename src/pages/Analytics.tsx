import { useMemo } from 'react';
import { BarChart3, TrendingUp, PieChart, DollarSign } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseCategory } from '@/types/expense';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#06b6d4', '#eab308', '#ec4899', '#6b7280'];

export default function Analytics() {
  const { projects, isLoading: projectsLoading } = useProjects();

  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['all-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const totalSpent = projects.reduce((sum, p) => sum + p.totalCost, 0);
    const avgProjectCost = projects.length > 0 ? totalSpent / projects.length : 0;
    const totalExpenses = allExpenses.length;
    const avgExpenseAmount = totalExpenses > 0 
      ? allExpenses.reduce((sum, e) => sum + Number(e.quantity) * Number(e.price), 0) / totalExpenses 
      : 0;

    return { totalSpent, avgProjectCost, totalExpenses, avgExpenseAmount };
  }, [projects, allExpenses]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    allExpenses.forEach((exp) => {
      const amount = Number(exp.quantity) * Number(exp.price);
      categories[exp.category] = (categories[exp.category] || 0) + amount;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allExpenses]);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const key = format(month, 'MMM yyyy');
      months[key] = 0;
    }

    allExpenses.forEach((exp) => {
      const date = new Date(exp.created_at);
      const key = format(date, 'MMM yyyy');
      if (months.hasOwnProperty(key)) {
        months[key] += Number(exp.quantity) * Number(exp.price);
      }
    });

    return Object.entries(months).map(([name, amount]) => ({ name, amount }));
  }, [allExpenses]);

  const isLoading = projectsLoading || expensesLoading;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Insights and trends across all your projects
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : (
            <>
              <StatCard
                title="Total Spent"
                value={`$${stats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                subtitle="All time"
                icon={<DollarSign className="h-6 w-6" />}
                iconClassName="gradient-primary"
              />
              <StatCard
                title="Avg. Project Cost"
                value={`$${stats.avgProjectCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                subtitle={`${projects.length} projects`}
                icon={<BarChart3 className="h-6 w-6" />}
                iconClassName="gradient-success"
              />
              <StatCard
                title="Total Expenses"
                value={stats.totalExpenses}
                subtitle="Line items"
                icon={<TrendingUp className="h-6 w-6" />}
              />
              <StatCard
                title="Avg. Expense"
                value={`$${stats.avgExpenseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                subtitle="Per line item"
                icon={<PieChart className="h-6 w-6" />}
                iconClassName="gradient-warning"
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Spending Trend</h3>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Spending by Category</h3>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Amount']}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No expense data yet
              </div>
            )}
          </div>
        </div>

        {/* Top Categories Table */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Spending Categories</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.slice(0, 5).map((cat, index) => {
                const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                const percentage = total > 0 ? (cat.value / total) * 100 : 0;
                return (
                  <div key={cat.name} className="flex items-center gap-4">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground font-semibold"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{cat.name}</span>
                        <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: COLORS[index % COLORS.length] 
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-semibold text-foreground w-28 text-right">
                      ${cat.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No expense data yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
