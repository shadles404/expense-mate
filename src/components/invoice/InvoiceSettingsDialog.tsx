import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';

const settingsSchema = z.object({
  company_name: z.string().optional(),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email().optional().or(z.literal('')),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  tax_enabled: z.boolean().default(false),
  default_payment_terms: z.string().default('Payment due within 30 days'),
  thank_you_message: z.string().default('Thank you for your business!'),
  include_signature_line: z.boolean().default(false),
  invoice_prefix: z.string().default('INV'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface InvoiceSettingsDialogProps {
  trigger?: React.ReactNode;
}

export function InvoiceSettingsDialog({ trigger }: InvoiceSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { settings, upsertSettings } = useInvoiceSettings();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: settings?.company_name || '',
      company_address: settings?.company_address || '',
      company_phone: settings?.company_phone || '',
      company_email: settings?.company_email || '',
      tax_rate: settings?.tax_rate || 0,
      tax_enabled: settings?.tax_enabled || false,
      default_payment_terms: settings?.default_payment_terms || 'Payment due within 30 days',
      thank_you_message: settings?.thank_you_message || 'Thank you for your business!',
      include_signature_line: settings?.include_signature_line || false,
      invoice_prefix: settings?.invoice_prefix || 'INV',
    },
    values: settings ? {
      company_name: settings.company_name || '',
      company_address: settings.company_address || '',
      company_phone: settings.company_phone || '',
      company_email: settings.company_email || '',
      tax_rate: settings.tax_rate,
      tax_enabled: settings.tax_enabled,
      default_payment_terms: settings.default_payment_terms,
      thank_you_message: settings.thank_you_message,
      include_signature_line: settings.include_signature_line,
      invoice_prefix: settings.invoice_prefix,
    } : undefined,
  });

  const onSubmit = async (data: SettingsFormData) => {
    await upsertSettings.mutateAsync(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Invoice Settings
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Company Information</h3>
              
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="123 Business St.&#10;City, State 12345" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="billing@company.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tax Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Tax Settings</h3>
              
              <FormField
                control={form.control}
                name="tax_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Tax</FormLabel>
                      <FormDescription>
                        Add tax calculation to invoices
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('tax_enabled') && (
                <FormField
                  control={form.control}
                  name="tax_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} step={0.1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Invoice Customization */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Invoice Customization</h3>
              
              <FormField
                control={form.control}
                name="invoice_prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number Prefix</FormLabel>
                    <FormControl>
                      <Input placeholder="INV" maxLength={10} {...field} />
                    </FormControl>
                    <FormDescription>
                      Prefix for invoice numbers (e.g., INV-00001)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment due within 30 days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thank_you_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thank You Message</FormLabel>
                    <FormControl>
                      <Input placeholder="Thank you for your business!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="include_signature_line"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Include Signature Line</FormLabel>
                      <FormDescription>
                        Add a signature line to the invoice footer
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertSettings.isPending}>
                {upsertSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
