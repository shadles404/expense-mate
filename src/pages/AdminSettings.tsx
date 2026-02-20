import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MODULE_KEYS, TIKTOK_SECTION_KEYS, AccessLevel } from '@/hooks/useModulePermissions';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Shield, Users, Settings, Loader2, Video } from 'lucide-react';

interface SubUser {
  id: string;
  sub_user_id: string;
  admin_user_id: string;
  is_active: boolean;
  created_at: string;
  profile?: { display_name: string | null; email: string | null; phone: string | null };
  role?: string;
  permissions?: { module_key: string; access_level: string }[];
  sectionPerms?: { section_key: string; access_level: string }[];
}

const defaultModulePerms = (): Record<string, AccessLevel> =>
  Object.fromEntries(MODULE_KEYS.map(m => [m.key, m.key === 'tiktok' ? 'none' : 'write']));

const defaultSectionPerms = (): Record<string, AccessLevel> =>
  Object.fromEntries(TIKTOK_SECTION_KEYS.map(s => [s.key, 'write']));

function PermSelect({
  value,
  onChange,
}: {
  value: AccessLevel;
  onChange: (v: AccessLevel) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AccessLevel)}>
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Access</SelectItem>
        <SelectItem value="read">Read Only</SelectItem>
        <SelectItem value="write">Read & Write</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Create form state
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', phone: '', role: 'user' });
  const [newPerms, setNewPerms] = useState<Record<string, AccessLevel>>(defaultModulePerms());
  const [newSectionPerms, setNewSectionPerms] = useState<Record<string, AccessLevel>>(defaultSectionPerms());

  // Edit form state
  const [editPerms, setEditPerms] = useState<Record<string, AccessLevel>>({});
  const [editSectionPerms, setEditSectionPerms] = useState<Record<string, AccessLevel>>({});

  // Fetch sub-users with profiles, roles, and permissions
  const { data: subUsers = [], isLoading } = useQuery({
    queryKey: ['admin-sub-users'],
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from('admin_sub_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const enriched = await Promise.all(
        (subs || []).map(async (sub: any) => {
          const [profileRes, roleRes, permRes, sectionPermRes] = await Promise.all([
            supabase.from('profiles').select('display_name, email, phone').eq('user_id', sub.sub_user_id).single(),
            supabase.from('user_roles').select('role').eq('user_id', sub.sub_user_id).single(),
            supabase.from('module_permissions').select('module_key, access_level').eq('user_id', sub.sub_user_id),
            (supabase as any).from('tiktok_section_permissions').select('section_key, access_level').eq('user_id', sub.sub_user_id),
          ]);
          return {
            ...sub,
            profile: profileRes.data,
            role: roleRes.data?.role || 'user',
            permissions: permRes.data || [],
            sectionPerms: sectionPermRes.data || [],
          };
        })
      );
      return enriched as SubUser[];
    },
    enabled: !!user?.id,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const modulePermissions = Object.entries(newPerms).map(([module_key, access_level]) => ({ module_key, access_level }));
      const tiktokSectionPermissions = Object.entries(newSectionPerms).map(([section_key, access_level]) => ({ section_key, access_level }));

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password,
            displayName: newUser.displayName,
            phone: newUser.phone,
            role: newUser.role,
            modulePermissions,
            tiktokSectionPermissions,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: 'User created successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-sub-users'] });
      setCreateOpen(false);
      setNewUser({ email: '', password: '', displayName: '', phone: '', role: 'user' });
      setNewPerms(defaultModulePerms());
      setNewSectionPerms(defaultSectionPerms());
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  // Update permissions mutation
  const updatePermsMutation = useMutation({
    mutationFn: async ({ userId, perms, sectionPerms }: { userId: string; perms: Record<string, AccessLevel>; sectionPerms: Record<string, AccessLevel> }) => {
      // Module permissions
      await supabase.from('module_permissions').delete().eq('user_id', userId);
      const rows = Object.entries(perms).map(([module_key, access_level]) => ({
        user_id: userId, module_key, access_level, granted_by: user?.id,
      }));
      const { error: modErr } = await supabase.from('module_permissions').insert(rows);
      if (modErr) throw modErr;

      // TikTok section permissions
      await (supabase as any).from('tiktok_section_permissions').delete().eq('user_id', userId);
      const sRows = Object.entries(sectionPerms).map(([section_key, access_level]) => ({
        user_id: userId, section_key, access_level, granted_by: user?.id,
      }));
      const { error: secErr } = await (supabase as any).from('tiktok_section_permissions').insert(sRows);
      if (secErr) throw secErr;
    },
    onSuccess: () => {
      toast({ title: 'Permissions updated' });
      queryClient.invalidateQueries({ queryKey: ['admin-sub-users'] });
      setEditUserId(null);
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('admin_sub_users').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sub-users'] }),
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) => {
      const { error } = await supabase.from('user_roles').update({ role }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Role updated' });
      queryClient.invalidateQueries({ queryKey: ['admin-sub-users'] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const editingUser = subUsers.find(u => u.sub_user_id === editUserId);

  const openEditPerms = (sub: SubUser) => {
    setEditUserId(sub.sub_user_id);
    const perms: Record<string, AccessLevel> = {};
    MODULE_KEYS.forEach(m => {
      const found = sub.permissions?.find(p => p.module_key === m.key);
      perms[m.key] = (found?.access_level as AccessLevel) || 'none';
    });
    setEditPerms(perms);

    const sp: Record<string, AccessLevel> = {};
    TIKTOK_SECTION_KEYS.forEach(s => {
      const found = sub.sectionPerms?.find(p => p.section_key === s.key);
      sp[s.key] = (found?.access_level as AccessLevel) || 'none';
    });
    setEditSectionPerms(sp);
  };

  const tiktokEnabledInNew = newPerms['tiktok'] !== 'none';
  const tiktokEnabledInEdit = editPerms['tiktok'] !== 'none';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
            <p className="text-muted-foreground">Manage users, roles, and module permissions</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />Create User
          </Button>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
            <TabsTrigger value="roles"><Shield className="h-4 w-4 mr-2" />Roles & Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Managed Users</CardTitle>
                <CardDescription>Users created under your admin account</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : subUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sub-users created yet. Click "Create User" to add one.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subUsers.map(sub => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.profile?.display_name || '—'}</TableCell>
                          <TableCell>{sub.profile?.email || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{sub.profile?.phone || '—'}</TableCell>
                          <TableCell>
                            <Select
                              value={sub.role || 'user'}
                              onValueChange={(v: string) => updateRoleMutation.mutate({ userId: sub.sub_user_id, role: v as 'admin' | 'moderator' | 'user' })}
                            >
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={sub.is_active}
                              onCheckedChange={v => toggleActiveMutation.mutate({ id: sub.id, is_active: v })}
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openEditPerms(sub)}>
                              <Settings className="h-4 w-4 mr-1" />Permissions
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Role Definitions</CardTitle>
                <CardDescription>System role capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { role: 'Admin', color: 'bg-red-500/20 text-red-700', desc: 'Full access to all modules. Can create and manage users, assign roles, and configure permissions.' },
                    { role: 'Moderator', color: 'bg-yellow-500/20 text-yellow-700', desc: 'Extended access based on assigned module permissions. Cannot manage other users.' },
                    { role: 'User', color: 'bg-blue-500/20 text-blue-700', desc: 'Standard access. Can only see modules assigned by admin. Data is isolated to their own scope.' },
                  ].map(({ role, color, desc }) => (
                    <div key={role} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={color}>{role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Create User Dialog ── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={newUser.displayName} onChange={e => setNewUser({ ...newUser, displayName: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} placeholder="+1 555 000 0000" />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Module Permissions */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Module Permissions</Label>
                <div className="rounded-lg border divide-y">
                  {MODULE_KEYS.map(m => (
                    <div key={m.key}>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-medium">{m.label}</span>
                        <PermSelect value={newPerms[m.key]} onChange={v => setNewPerms({ ...newPerms, [m.key]: v })} />
                      </div>

                      {/* TikTok section-level controls */}
                      {m.key === 'tiktok' && tiktokEnabledInNew && (
                        <div className="bg-muted/40 px-4 pb-3 pt-1 space-y-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Video className="h-3 w-3" />
                            TikTok Section Permissions
                          </div>
                          {TIKTOK_SECTION_KEYS.map(s => (
                            <div key={s.key} className="flex items-center justify-between pl-3">
                              <span className="text-xs text-muted-foreground">{s.label}</span>
                              <PermSelect value={newSectionPerms[s.key]} onChange={v => setNewSectionPerms({ ...newSectionPerms, [s.key]: v })} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => createUserMutation.mutate()} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Edit Permissions Dialog ── */}
        <Dialog open={!!editUserId} onOpenChange={v => !v && setEditUserId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Permissions — {editingUser?.profile?.display_name || editingUser?.profile?.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-base font-semibold">Module Permissions</Label>
              <div className="rounded-lg border divide-y">
                {MODULE_KEYS.map(m => (
                  <div key={m.key}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium">{m.label}</span>
                      <PermSelect
                        value={editPerms[m.key] || 'none'}
                        onChange={v => setEditPerms({ ...editPerms, [m.key]: v })}
                      />
                    </div>

                    {m.key === 'tiktok' && tiktokEnabledInEdit && (
                      <div className="bg-muted/40 px-4 pb-3 pt-1 space-y-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Video className="h-3 w-3" />
                          TikTok Section Permissions
                        </div>
                        {TIKTOK_SECTION_KEYS.map(s => (
                          <div key={s.key} className="flex items-center justify-between pl-3">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <PermSelect
                              value={editSectionPerms[s.key] || 'none'}
                              onChange={v => setEditSectionPerms({ ...editSectionPerms, [s.key]: v })}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUserId(null)}>Cancel</Button>
              <Button
                onClick={() => editUserId && updatePermsMutation.mutate({ userId: editUserId, perms: editPerms, sectionPerms: editSectionPerms })}
                disabled={updatePermsMutation.isPending}
              >
                {updatePermsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Permissions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
