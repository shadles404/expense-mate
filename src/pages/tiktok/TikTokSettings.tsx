import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTikTokSettings } from '@/hooks/useTikTokSettings';
import { useState, useEffect } from 'react';

export default function TikTokSettingsPage() {
  const { settings, isLoading, upsertSettings } = useTikTokSettings();
  const [form, setForm] = useState({
    currency: 'USD',
    default_contract_type: 'Freelance',
    tax_rate: 0,
    monthly_influencer_budget: 0,
    delivery_budget: 0,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        currency: settings.currency || 'USD',
        default_contract_type: settings.default_contract_type || 'Freelance',
        tax_rate: settings.tax_rate || 0,
        monthly_influencer_budget: settings.monthly_influencer_budget || 0,
        delivery_budget: settings.delivery_budget || 0,
      });
    }
  }, [settings]);

  const handleSave = () => {
    upsertSettings.mutate({
      currency: form.currency,
      default_contract_type: form.default_contract_type,
      tax_rate: form.tax_rate,
    } as any);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">TikTok Settings</h1>

        <Card>
          <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="MAD">MAD (د.م.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Contract Type</Label>
              <Select value={form.default_contract_type} onValueChange={(v) => setForm({ ...form, default_contract_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tax Rate (%)</Label>
              <Input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} />
            </div>
            <Button onClick={handleSave} disabled={upsertSettings.isPending}>
              {upsertSettings.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
