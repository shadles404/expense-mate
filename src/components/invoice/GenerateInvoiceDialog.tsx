import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { FileText, Download, Printer, Share2, Settings } from 'lucide-react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { InvoiceSettingsDialog } from './InvoiceSettingsDialog';
import { generateInvoicePdf } from '@/lib/generateInvoicePdf';
import { Expense } from '@/types/expense';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const invoiceFormSchema = z.object({
  client_name: z.string().optional(),
  invoice_date: z.string(),
  due_date: z.string().optional(),
  discount_amount: z.coerce.number().min(0).default(0),
  include_tax: z.boolean().default(true),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface GenerateInvoiceDialogProps {
  projectId: string;
  projectTitle: string;
  expenses: Expense[];
  totalCost: number;
}

export function GenerateInvoiceDialog({
  projectId,
  projectTitle,
  expenses,
  totalCost,
}: GenerateInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings, getNextInvoiceNumber, incrementInvoiceNumber } = useInvoiceSettings();
  const { user } = useAuth();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client_name: '',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      discount_amount: 0,
      include_tax: settings?.tax_enabled || false,
    },
  });

  const watchIncludeTax = form.watch('include_tax');
  const watchDiscount = form.watch('discount_amount');

  const subtotal = totalCost;
  const taxAmount = watchIncludeTax && settings?.tax_enabled 
    ? subtotal * (settings.tax_rate / 100) 
    : 0;
  const discountValue = Number(watchDiscount) || 0;
  const grandTotal = subtotal + taxAmount - discountValue;

  const expenseItems = expenses.map((exp, index) => ({
    no: index + 1,
    description: exp.description,
    quantity: exp.quantity,
    price: exp.price,
    amount: exp.quantity * exp.price,
  }));

  const handleGenerate = async (data: InvoiceFormData, action: 'download' | 'print' | 'share') => {
    if (!user) {
      toast.error('Please sign in to generate invoices');
      return;
    }

    if (expenses.length === 0) {
      toast.error('No expenses to include in invoice');
      return;
    }

    setIsGenerating(true);

    try {
      const invoiceNumber = getNextInvoiceNumber();
      
      const pdf = generateInvoicePdf({
        settings,
        projectTitle,
        invoiceNumber,
        clientName: data.client_name || '',
        invoiceDate: new Date(data.invoice_date),
        dueDate: data.due_date ? new Date(data.due_date) : null,
        expenses: expenseItems,
        subtotal,
        taxAmount,
        discountAmount: discountValue,
        total: grandTotal,
      });

      // Save invoice record to database
      await supabase.from('invoices').insert({
        user_id: user.id,
        project_id: projectId,
        invoice_number: invoiceNumber,
        client_name: data.client_name || null,
        invoice_date: data.invoice_date,
        due_date: data.due_date || null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountValue,
        total: grandTotal,
        status: 'generated',
      });

      // Increment invoice number
      await incrementInvoiceNumber.mutateAsync();

      if (action === 'download') {
        pdf.save(`${invoiceNumber}_${projectTitle.replace(/\s+/g, '_')}.pdf`);
        toast.success('Invoice downloaded successfully');
      } else if (action === 'print') {
        pdf.autoPrint();
        window.open(pdf.output('bloburl'), '_blank');
        toast.success('Invoice sent to print');
      } else if (action === 'share') {
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], `${invoiceNumber}.pdf`, { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Invoice ${invoiceNumber}`,
            text: `Invoice for ${projectTitle}`,
          });
          toast.success('Invoice shared successfully');
        } else {
          // Fallback: download the file
          pdf.save(`${invoiceNumber}_${projectTitle.replace(/\s+/g, '_')}.pdf`);
          toast.info('Sharing not supported, file downloaded instead');
        }
      }

      setOpen(false);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Invoice
            </span>
            <InvoiceSettingsDialog 
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              }
            />
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Invoice Number</span>
                <span className="font-mono font-medium">{getNextInvoiceNumber()}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Project</span>
                <span className="font-medium">{projectTitle}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Client or Company Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="discount_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={0.01} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {settings?.tax_enabled && (
              <FormField
                control={form.control}
                name="include_tax"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Include Tax ({settings.tax_rate}%)</FormLabel>
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
            )}

            <Separator />

            {/* Invoice Summary */}
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expenses ({expenses.length} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {watchIncludeTax && settings?.tax_enabled && taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({settings.tax_rate}%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              {discountValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">-${discountValue.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => form.handleSubmit((data) => handleGenerate(data, 'download'))()}
                disabled={isGenerating || expenses.length === 0}
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.handleSubmit((data) => handleGenerate(data, 'print'))()}
                  disabled={isGenerating || expenses.length === 0}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.handleSubmit((data) => handleGenerate(data, 'share'))()}
                  disabled={isGenerating || expenses.length === 0}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
