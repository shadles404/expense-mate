import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExpenseCategory } from '@/types/category';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useCategories() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['expense_categories', user?.id],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: category, error } = await supabase
        .from('expense_categories')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_categories'] });
      toast.success('Category created');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Category name already exists');
      } else {
        toast.error('Failed to create category: ' + error.message);
      }
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ExpenseCategory> & { id: string }) => {
      const { data: category, error } = await supabase
        .from('expense_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_categories'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Category updated');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Category name already exists');
      } else {
        toast.error('Failed to update category: ' + error.message);
      }
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      // Check if category is in use
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (expenses && expenses.length > 0) {
        throw new Error('Category is in use by expenses. Remove or reassign expenses first.');
      }

      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_categories'] });
      toast.success('Category deleted');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
