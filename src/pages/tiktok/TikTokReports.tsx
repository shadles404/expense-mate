import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useTikTokPayments } from '@/hooks/useTikTokPayments';
import { useTikTokDeliveries } from '@/hooks/useTikTokDeliveries';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function TikTokReports() {
  const { advertisers, isLoading: loadingAdvertisers } = useTikTokAdvertisers();
  const { payments, isLoading: loadingPayments } = useTikTokPayments();
  const { deliveries, isLoading: loadingDeliveries } = useTikTokDeliveries();
  const [exporting, setExporting] = useState(false);

  const isLoading = loadingAdvertisers || loadingPayments || loadingDeliveries;

  const monthlyPerformance = useMemo(() => {
    const months: Record<string, { completed: number; target: number }> = {};
    advertisers.forEach(a => {
      const month = format(new Date(a.created_at), 'MMM yyyy');
      if (!months[month]) months[month] = { completed: 0, target: 0 };
      months[month].completed += a.completed_videos;
      months[month].target += a.target_videos;
    });
    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data,
      rate: data.target > 0 ? ((data.completed / data.target) * 100).toFixed(1) : 0,
    }));
  }, [advertisers]);

  const costPerVideo = useMemo(() => {
    const totalVideos = advertisers.reduce((sum, a) => sum + a.completed_videos, 0);
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    return totalVideos > 0 ? totalPaid / totalVideos : 0;
  }, [advertisers, payments]);

  const completionByAdType = useMemo(() => {
    const types: Record<string, { completed: number; target: number }> = {};
    advertisers.forEach(a => {
      a.ad_types.forEach(type => {
        if (!types[type]) types[type] = { completed: 0, target: 0 };
        types[type].completed += a.completed_videos;
        types[type].target += a.target_videos;
      });
    });
    return Object.entries(types).map(([name, data]) => ({
      name,
      completed: data.completed,
      target: data.target,
      rate: data.target > 0 ? ((data.completed / data.target) * 100).toFixed(1) : 0,
    }));
  }, [advertisers]);

  const salaryVsOutput = useMemo(() => {
    return advertisers.map(a => ({
      name: a.name.length > 10 ? a.name.slice(0, 10) + '...' : a.name,
      salary: a.salary,
      videos: a.completed_videos,
      efficiency: a.completed_videos > 0 ? (a.salary / a.completed_videos).toFixed(2) : 0,
    }));
  }, [advertisers]);

  const exportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Advertisers', advertisers.length],
      ['Total Budget', `$${advertisers.reduce((s, a) => s + a.salary, 0).toLocaleString()}`],
      ['Total Videos Completed', advertisers.reduce((s, a) => s + a.completed_videos, 0)],
      ['Total Videos Target', advertisers.reduce((s, a) => s + a.target_videos, 0)],
      ['Cost Per Video', `$${costPerVideo.toFixed(2)}`],
      ['Total Paid', `$${payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0).toLocaleString()}`],
      ['Total Unpaid', `$${payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0).toLocaleString()}`],
      ['Approved Deliveries', deliveries.filter(d => d.status === 'approved').length],
      ['Pending Deliveries', deliveries.filter(d => d.status === 'pending').length],
      ['Rejected Deliveries', deliveries.filter(d => d.status === 'rejected').length],
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tiktok-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('TikTok Managing Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 30);

      // Summary Table
      doc.setFontSize(14);
      doc.text('Summary', 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: [
          ['Total Advertisers', advertisers.length.toString()],
          ['Total Budget', `$${advertisers.reduce((s, a) => s + a.salary, 0).toLocaleString()}`],
          ['Videos Completed', `${advertisers.reduce((s, a) => s + a.completed_videos, 0)} / ${advertisers.reduce((s, a) => s + a.target_videos, 0)}`],
          ['Cost Per Video', `$${costPerVideo.toFixed(2)}`],
        ],
      });

      // Completion by Ad Type
      const finalY = (doc as any).lastAutoTable.finalY || 80;
      doc.setFontSize(14);
      doc.text('Completion by Ad Type', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Ad Type', 'Completed', 'Target', 'Rate']],
        body: completionByAdType.map(item => [
          item.name,
          item.completed.toString(),
          item.target.toString(),
          `${item.rate}%`,
        ]),
      });

      doc.save(`tiktok-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="mt-1 text-muted-foreground">Analyze performance and generate reports</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={exportPDF} disabled={exporting} className="gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Export PDF
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[350px]" />)}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cost Per Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${costPerVideo.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Approved Deliveries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{deliveries.filter(d => d.status === 'approved').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Deliveries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{deliveries.filter(d => d.status === 'pending').length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Completion by Ad Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {completionByAdType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={completionByAdType}>
                        <XAxis dataKey="name" />
                        <YAxis />
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

              <Card>
                <CardHeader>
                  <CardTitle>Salary vs Output</CardTitle>
                </CardHeader>
                <CardContent>
                  {salaryVsOutput.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salaryVsOutput.slice(0, 8)} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value, name) => [name === 'salary' ? `$${value}` : value, name]} />
                        <Legend />
                        <Bar dataKey="salary" fill="hsl(var(--primary))" name="Salary ($)" />
                        <Bar dataKey="videos" fill="#10b981" name="Videos" />
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
          </>
        )}
      </div>
    </Layout>
  );
}
