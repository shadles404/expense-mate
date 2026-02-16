import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { useTikTokDeliveries } from '@/hooks/useTikTokDeliveries';
import { Search, CheckCircle, XCircle, Video } from 'lucide-react';

export default function TikTokTracking() {
  const { influencers, updateInfluencer } = useTikTokAdvertisers();
  const { deliveries } = useTikTokDeliveries();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const activeInfluencers = influencers.filter((i) => i.is_active);

  const filtered = activeInfluencers.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === 'reached') return matchSearch && i.completed_videos >= i.target_videos && i.target_videos > 0;
    if (statusFilter === 'unreached') return matchSearch && i.completed_videos < i.target_videos;
    return matchSearch;
  });

  const incrementVideo = (i: typeof influencers[0]) => {
    updateInfluencer.mutate({ id: i.id, completed_videos: i.completed_videos + 1 });
  };

  const decrementVideo = (i: typeof influencers[0]) => {
    if (i.completed_videos > 0) {
      updateInfluencer.mutate({ id: i.id, completed_videos: i.completed_videos - 1 });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Target Video Tracking</h1>

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

        <div className="grid gap-4">
          {filtered.map((i) => {
            const pct = i.target_videos > 0 ? Math.min(100, (i.completed_videos / i.target_videos) * 100) : 0;
            const reached = i.target_videos > 0 && i.completed_videos >= i.target_videos;
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
                          {i.completed_videos} / {i.target_videos}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {i.target_videos - i.completed_videos > 0 ? `${i.target_videos - i.completed_videos} remaining` : 'All targets completed!'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => decrementVideo(i)} disabled={i.completed_videos === 0}>−</Button>
                      <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
                        <Video className="h-4 w-4" />
                        <span className="font-bold">{i.completed_videos}</span>
                      </div>
                      <Button size="sm" onClick={() => incrementVideo(i)}>+</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No influencers found</CardContent></Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
