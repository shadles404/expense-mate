import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useTikTokDeliveries } from '@/hooks/useTikTokDeliveries';
import { useTikTokPayments } from '@/hooks/useTikTokPayments';
import { useTikTokTrackingHistory } from '@/hooks/useTikTokTrackingHistory';
import { useTikTokSectionPermissions } from '@/hooks/useModulePermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { Search, CheckCircle, XCircle, Video, Download, RotateCcw } from 'lucide-react';
import { downloadCSV } from '@/lib/csvExport';
import { toast } from '@/hooks/use-toast';

export default function TikTokTracking() {
  const { influencers, updateInfluencer } = useTikTokAdvertisers();
  const { deliveries } = useTikTokDeliveries();
  const { createPayment } = useTikTokPayments();
  const { history, archiveAndReset } = useTikTokTrackingHistory();
  const { canWriteSection } = useTikTokSectionPermissions();
  const { isAdmin } = useUserRole();
  const canWrite = canWriteSection('tiktok_tracking');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const activeInfluencers = influencers.filter((i) => i.is_active);

  const filtered = activeInfluencers.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === 'reached') return matchSearch && i.completed_videos >= i.target_videos && i.target_videos > 0;
    if (statusFilter === 'unreached') return matchSearch && i.completed_videos < i.target_videos;
    return matchSearch;
  });

  const handleCompletedChange = (i: typeof influencers[0], value: string) => {
    setEditingValues(prev => ({ ...prev, [i.id]: value }));
  };

  const handleCompletedBlur = (i: typeof influencers[0]) => {
    const raw = editingValues[i.id];
    if (raw === undefined) return;
    
    let newCompleted = parseInt(raw, 10);
    if (isNaN(newCompleted) || newCompleted < 0) newCompleted = 0;
    if (newCompleted > i.target_videos) {
      newCompleted = i.target_videos;
      toast({ title: 'Validation', description: `Completed cannot exceed target (${i.target_videos})`, variant: 'destructive' });
    }

    if (newCompleted !== i.completed_videos) {
      const prevCompleted = i.completed_videos;
      updateInfluencer.mutate({ id: i.id, completed_videos: newCompleted });

      if (newCompleted >= i.target_videos && i.target_videos > 0 && prevCompleted < i.target_videos) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        createPayment.mutate({
          advertiser_id: i.id,
          amount: i.salary,
          campaign_month: currentMonth,
          total_target_videos: i.target_videos,
          completed_videos: newCompleted,
          status: 'pending',
          notes: 'Auto-added: target videos completed',
        });
        toast({ title: 'Target reached!', description: `${i.name} auto-added to Payment Confirmation as Pending` });
      }
    }

    setEditingValues(prev => {
      const next = { ...prev };
      delete next[i.id];
      return next;
    });
  };

  const handleMonthlyReset = () => {
    if (!confirm('This will archive current tracking data and reset all completed counts to 0. Continue?')) return;
    archiveAndReset.mutate(
      activeInfluencers.map(i => ({ id: i.id, target_videos: i.target_videos, completed_videos: i.completed_videos }))
    );
  };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleExportCSV = () => {
    downloadCSV(filtered.map((i) => ({
      Name: i.name,
      Username: i.tiktok_username || '',
      Category: i.category || '',
      'Target Videos': i.target_videos,
      'Completed Videos': i.completed_videos,
      Remaining: Math.max(0, i.target_videos - i.completed_videos),
      Status: i.completed_videos >= i.target_videos ? 'Reached' : 'Unreached',
    })), 'tracking');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Target Video Tracking</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tracking period: {currentMonthName} · Active influencers only
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />CSV
            </Button>
            {isAdmin && canWrite && (
              <Button variant="destructive" onClick={handleMonthlyReset} disabled={archiveAndReset.isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />Monthly Reset
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="reached">Reached Target</SelectItem>
              <SelectItem value="unreached">Unreached</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {history.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Recent History</h3>
              <div className="flex gap-4 overflow-x-auto text-xs">
                {[...new Set(history.map(h => h.tracking_month))].slice(0, 3).map(month => {
                  const monthRecords = history.filter(h => h.tracking_month === month);
                  const reached = monthRecords.filter(h => h.reached_target).length;
                  return (
                    <div key={month} className="flex-shrink-0 p-2 rounded bg-muted/50 min-w-[120px]">
                      <p className="font-medium">{month}</p>
                      <p className="text-muted-foreground">{reached}/{monthRecords.length} reached</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {filtered.map((i) => {
            const displayCompleted = editingValues[i.id] !== undefined ? editingValues[i.id] : String(i.completed_videos);
            const currentCompleted = editingValues[i.id] !== undefined ? parseInt(editingValues[i.id], 10) || 0 : i.completed_videos;
            const pct = i.target_videos > 0 ? Math.min(100, (currentCompleted / i.target_videos) * 100) : 0;
            const reached = i.target_videos > 0 && currentCompleted >= i.target_videos;
            return (
              <Card key={i.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{i.name}</h3>
                        <Badge variant={reached ? 'default' : 'destructive'}>
                          {reached ? <><CheckCircle className="h-3 w-3 mr-1" />Reached</> : <><XCircle className="h-3 w-3 mr-1" />Unreached</>}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {i.tiktok_username || 'No username'} · {i.category || 'No category'}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress value={pct} className="h-3" />
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {currentCompleted} / {i.target_videos}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {i.target_videos - currentCompleted > 0 ? `${i.target_videos - currentCompleted} remaining` : 'All targets completed!'}
                      </p>
                    </div>
                    {canWrite && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={0}
                            max={i.target_videos}
                            value={displayCompleted}
                            onChange={(e) => handleCompletedChange(i, e.target.value)}
                            onBlur={() => handleCompletedBlur(i)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCompletedBlur(i); }}
                            className="w-20 h-9 text-center font-bold"
                          />
                          <span className="text-sm text-muted-foreground">/ {i.target_videos}</span>
                        </div>
                      </div>
                    )}
                    {!canWrite && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
                        <Video className="h-4 w-4" />
                        <span className="font-bold">{i.completed_videos}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No active influencers found</CardContent></Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
