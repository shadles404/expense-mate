import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseCategory } from '@/types/expense';
import { toast } from 'sonner';

export function useExpenses(projectId: string | undefined) {
  const queryClient = useQueryClient();

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
        quantity: Number(exp.quantity),
        price: Number(exp.price),
        category: exp.category as ExpenseCategory,
      }));
    },
    enabled: !!projectId,
  });

  const createExpense = useMutation({
    mutationFn: async (data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert([data])
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
