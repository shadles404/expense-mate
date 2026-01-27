import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { TikTokAdvertiser, AD_TYPES } from '@/types/tiktok';
import { Search, Download, Edit, RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TikTokTracking() {
  const { advertisers, isLoading, updateAdvertiser, resetProgress, deleteAdvertiser } = useTikTokAdvertisers();
  const [searchQuery, setSearchQuery] = useState('');
  const [adTypeFilter, setAdTypeFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredAdvertisers = useMemo(() => {
    return advertisers.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAdType = adTypeFilter === 'all' || a.ad_types.includes(adTypeFilter as any);
      return matchesSearch && matchesAdType;
    });
  }, [advertisers, searchQuery, adTypeFilter]);

  const getStatus = (completed: number, target: number) => {
    if (completed === 0) return { label: 'Not Started', variant: 'secondary' as const };
    if (completed >= target) return { label: 'Completed', variant: 'default' as const };
    return { label: 'In Progress', variant: 'outline' as const };
  };

  const handleCheckVideo = async (advertiser: TikTokAdvertiser, index: number, checked: boolean) => {
    const newCompleted = checked ? index + 1 : index;
    await updateAdvertiser.mutateAsync({
      id: advertiser.id,
      completed_videos: Math.max(0, Math.min(newCompleted, advertiser.target_videos)),
    });
  };

  const exportCSV = () => {
    const headers = ['No', 'Name', 'Phone', 'Salary', 'Contract', 'Target', 'Progress', 'Status', 'Ad Types', 'Platform', 'Notes'];
    const rows = filteredAdvertisers.map((a, i) => [
      i + 1,
      a.name,
      a.phone || '',
      a.salary,
      a.contract_type,
      a.target_videos,
      `${a.completed_videos}/${a.target_videos}`,
      getStatus(a.completed_videos, a.target_videos).label,
      a.ad_types.join(', '),
      a.platform,
      a.notes || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tiktok-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tracking</h1>
            <p className="mt-1 text-muted-foreground">Monitor advertiser progress and performance</p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={adTypeFilter} onValueChange={setAdTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by ad type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {AD_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filteredAdvertisers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No advertisers found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead className="min-w-[200px]">Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ad Types</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdvertisers.map((advertiser, index) => {
                      const status = getStatus(advertiser.completed_videos, advertiser.target_videos);
                      const progressPercent = (advertiser.completed_videos / advertiser.target_videos) * 100;
                      
                      return (
                        <TableRow key={advertiser.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{advertiser.name}</TableCell>
                          <TableCell>{advertiser.phone || '-'}</TableCell>
                          <TableCell>${advertiser.salary.toLocaleString()}</TableCell>
                          <TableCell>{advertiser.contract_type}</TableCell>
                          <TableCell>{advertiser.target_videos}</TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {Array.from({ length: advertiser.target_videos }).map((_, i) => (
                                  <Checkbox
                                    key={i}
                                    checked={i < advertiser.completed_videos}
                                    onCheckedChange={(checked) => handleCheckVideo(advertiser, i, checked as boolean)}
                                    className="h-4 w-4"
                                  />
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={progressPercent} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {advertiser.completed_videos}/{advertiser.target_videos}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {advertiser.ad_types.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{advertiser.platform}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{advertiser.notes || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resetProgress.mutate(advertiser.id)}
                                disabled={resetProgress.isPending}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(advertiser.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertiser?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the advertiser and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteAdvertiser.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
