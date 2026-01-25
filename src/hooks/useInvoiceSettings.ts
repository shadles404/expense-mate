import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceSettings } from '@/types/invoice';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useInvoiceSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['invoice-settings', user?.id],
    queryFn: async (): Promise<InvoiceSettings | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          tax_rate: Number(data.tax_rate),
          next_invoice_number: Number(data.next_invoice_number),
        };
      }
      
      return null;
    },
    enabled: !!user,
  });

  const upsertSettings = useMutation({
    mutationFn: async (data: Partial<InvoiceSettings>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: existingSettings } = await supabase
        .from('invoice_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSettings) {
        const { data: updated, error } = await supabase
          .from('invoice_settings')
          .update(data)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('invoice_settings')
          .insert([{ ...data, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-settings'] });
      toast.success('Invoice settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const incrementInvoiceNumber = useMutation({
    mutationFn: async () => {
      if (!user || !settings) throw new Error('Not ready');
      
      const { error } = await supabase
        .from('invoice_settings')
        .update({ next_invoice_number: settings.next_invoice_number + 1 })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-settings'] });
    },
  });

  const getNextInvoiceNumber = (): string => {
    const prefix = settings?.invoice_prefix || 'INV';
    const number = settings?.next_invoice_number || 1;
    return `${prefix}-${String(number).padStart(5, '0')}`;
  };

  return {
    settings,
    isLoading,
    error,
    upsertSettings,
    incrementInvoiceNumber,
    getNextInvoiceNumber,
  };
}
