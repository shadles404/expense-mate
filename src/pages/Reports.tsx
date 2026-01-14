import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ExpenseCategory } from '@/types/expense';

export default function Reports() {
  const { projects, isLoading: projectsLoading } = useProjects();
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['all-expenses-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, projects(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((exp) => {
      const expDate = new Date(exp.created_at);
      const from = startOfDay(new Date(dateFrom));
      const to = endOfDay(new Date(dateTo));
      
      const inDateRange = isWithinInterval(expDate, { start: from, end: to });
      const matchesProject = selectedProject === 'all' || exp.project_id === selectedProject;
      const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;

      return inDateRange && matchesProject && matchesCategory;
    });
  }, [allExpenses, dateFrom, dateTo, selectedProject, selectedCategory]);

  const reportStats = useMemo(() => {
    const total = filteredExpenses.reduce(
      (sum, exp) => sum + Number(exp.quantity) * Number(exp.price),
      0
    );
    const count = filteredExpenses.length;
    const avgAmount = count > 0 ? total / count : 0;

    const categoryBreakdown: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      const amount = Number(exp.quantity) * Number(exp.price);
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + amount;
    });

    return { total, count, avgAmount, categoryBreakdown };
  }, [filteredExpenses]);

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Project', 'Description', 'Category', 'Quantity', 'Price', 'Amount'];
    const rows = filteredExpenses.map((exp) => [
      format(new Date(exp.created_at), 'yyyy-MM-dd'),
      (exp as any).projects?.title || 'Unknown',
      exp.description,
      exp.category,
      exp.quantity,
      exp.price,
      (Number(exp.quantity) * Number(exp.price)).toFixed(2),
    ]);

    rows.push(['', '', '', '', '', 'Total:', reportStats.total.toFixed(2)]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const isLoading = projectsLoading || expensesLoading;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="mt-1 text-muted-foreground">
              Generate and export expense reports
            </p>
          </div>
          <Button onClick={handleExportCSV} className="btn-float gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Filters</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Labor">Labor</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Wedding">Wedding</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              ${reportStats.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{reportStats.count}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm font-medium text-muted-foreground">Average per Expense</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              ${reportStats.avgAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(reportStats.categoryBreakdown).length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(reportStats.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-foreground">{category}</span>
                    <span className="text-muted-foreground">
                      ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Expense Details</h3>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.slice(0, 50).map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(exp.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {(exp as any).projects?.title || 'Unknown'}
                      </TableCell>
                      <TableCell>{exp.description}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded-md text-sm">
                          {exp.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{exp.quantity}</TableCell>
                      <TableCell className="text-right">${Number(exp.price).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${(Number(exp.quantity) * Number(exp.price)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredExpenses.length > 50 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t border-border">
                  Showing first 50 of {filteredExpenses.length} expenses. Export to see all.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No expenses found</h3>
              <p className="mt-1 text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
