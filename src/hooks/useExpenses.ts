import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseCategoryLegacy } from '@/types/expense';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useExpenses(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async (): Promise<Expense[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(exp => ({
        ...exp,
        user_id: exp.user_id || '',
        quantity: Number(exp.quantity),
        price: Number(exp.price),
        category: exp.category as ExpenseCategoryLegacy,
        category_id: exp.category_id || null,
      }));
    },
    enabled: !!projectId && !!user,
  });

  const createExpense = useMutation({
    mutationFn: async (data: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Failed to create expense: ' + error.message);
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Expense> & { id: string }) => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Failed to update expense: ' + error.message);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Expense deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete expense: ' + error.message);
    },
  });

  const totalCost = expenses.reduce(
    (sum, exp) => sum + exp.quantity * exp.price,
    0
  );

  const categoryTotals = expenses.reduce((acc, exp) => {
    const amount = exp.quantity * exp.price;
    acc[exp.category] = (acc[exp.category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    expenses,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    totalCost,
    categoryTotals,
  };
}
