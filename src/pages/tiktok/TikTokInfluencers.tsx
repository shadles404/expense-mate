import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/csvExport';
import type { TikTokInfluencer } from '@/types/tiktok';

export default function TikTokInfluencers() {
  const { influencers, isLoading, createInfluencer, updateInfluencer, deleteInfluencer } = useTikTokAdvertisers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TikTokInfluencer | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', tiktok_username: '', category: '', target_videos: 0,
    salary: 0, agreement_start_date: '', agreement_end_date: '', notes: '', is_active: true,
  });

  const resetForm = () => {
    setForm({ name: '', phone: '', tiktok_username: '', category: '', target_videos: 0, salary: 0, agreement_start_date: '', agreement_end_date: '', notes: '', is_active: true });
    setEditing(null);
  };

  const openEdit = (i: TikTokInfluencer) => {
    setEditing(i);
    setForm({
      name: i.name, phone: i.phone || '', tiktok_username: i.tiktok_username || '',
      category: i.category || '', target_videos: i.target_videos, salary: i.salary,
      agreement_start_date: i.agreement_start_date || '', agreement_end_date: i.agreement_end_date || '',
      notes: i.notes || '', is_active: i.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name, phone: form.phone || null, tiktok_username: form.tiktok_username || null,
      category: form.category || null, target_videos: form.target_videos, salary: form.salary,
      agreement_start_date: form.agreement_start_date || null, agreement_end_date: form.agreement_end_date || null,
      notes: form.notes || null, is_active: form.is_active,
    };
    if (editing) {
      updateInfluencer.mutate({ id: editing.id, ...payload });
    } else {
      createInfluencer.mutate(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const filtered = influencers.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.tiktok_username || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    downloadCSV(filtered.map((i) => ({
      Name: i.name,
      Username: i.tiktok_username || '',
      Phone: i.phone || '',
      Category: i.category || '',
      'Target Videos': i.target_videos,
      'Completed Videos': i.completed_videos,
      Salary: i.salary,
      Status: i.is_active ? 'Active' : 'Inactive',
      'Agreement Start': i.agreement_start_date || '',
      'Agreement End': i.agreement_end_date || '',
    })), 'influencers');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Influencer Registration</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />CSV
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Influencer</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Influencer' : 'Register Influencer'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                    <div><Label>TikTok Username</Label><Input value={form.tiktok_username} onChange={(e) => setForm({ ...form, tiktok_username: e.target.value })} placeholder="@username" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                    <div><Label>Category / Niche</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Beauty, Food" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Target Videos/Month</Label><Input type="number" value={form.target_videos} onChange={(e) => setForm({ ...form, target_videos: Number(e.target.value) })} /></div>
                    <div><Label>Salary</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Agreement Start</Label><Input type="date" value={form.agreement_start_date} onChange={(e) => setForm({ ...form, agreement_start_date: e.target.value })} /></div>
                    <div><Label>Agreement End</Label><Input type="date" value={form.agreement_end_date} onChange={(e) => setForm({ ...form, agreement_end_date: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.is_active ? 'active' : 'inactive'} onValueChange={(v) => setForm({ ...form, is_active: v === 'active' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                  <Button onClick={handleSubmit} disabled={!form.name} className="w-full">{editing ? 'Update' : 'Register'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search influencers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell>{i.tiktok_username || '—'}</TableCell>
                    <TableCell>{i.category || '—'}</TableCell>
                    <TableCell>{i.target_videos}</TableCell>
                    <TableCell>{i.completed_videos}</TableCell>
                    <TableCell>
                      <Badge variant={i.is_active ? 'default' : 'secondary'}>
                        {i.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteInfluencer.mutate(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{isLoading ? 'Loading...' : 'No influencers found'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
