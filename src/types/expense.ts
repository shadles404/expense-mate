// Legacy type kept for backwards compatibility with old enum data
export type ExpenseCategoryLegacy = 
  | 'Materials'
  | 'Labor'
  | 'Marketing'
  | 'Equipment'
  | 'Transportation'
  | 'Utilities'
  | 'Wedding'
  | 'Other';

// Alias for backwards compatibility
export type ExpenseCategory = ExpenseCategoryLegacy;

export interface Expense {
  id: string;
  user_id: string;
  project_id: string;
  description: string;
  quantity: number;
  price: number;
  category: ExpenseCategoryLegacy; // Legacy enum field
  category_id: string | null; // New category reference
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  budget: number;
  created_at: string;
  updated_at: string;
  expenses?: Expense[];
}

export interface ProjectWithTotals extends Project {
  totalCost: number;
  expenseCount: number;
}
