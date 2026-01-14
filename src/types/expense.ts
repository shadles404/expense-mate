export type ExpenseCategory = 
  | 'Materials'
  | 'Labor'
  | 'Marketing'
  | 'Equipment'
  | 'Transportation'
  | 'Utilities'
  | 'Wedding'
  | 'Other';

export interface Expense {
  id: string;
  project_id: string;
  description: string;
  quantity: number;
  price: number;
  category: ExpenseCategory;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
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
