import { ExpenseCategory } from '@/types/expense';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Materials: 'bg-blue-500',
  Labor: 'bg-green-500',
  Marketing: 'bg-purple-500',
  Equipment: 'bg-orange-500',
  Transportation: 'bg-cyan-500',
  Utilities: 'bg-yellow-500',
  Wedding: 'bg-pink-500',
  Other: 'bg-gray-500',
};

interface CategorySummaryProps {
  categoryTotals: Record<string, number>;
  totalCost: number;
}

export function CategorySummary({ categoryTotals, totalCost }: CategorySummaryProps) {
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a);

  if (sortedCategories.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Expenses by Category</h3>
      <div className="space-y-3">
        {sortedCategories.map(([category, amount]) => {
          const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0;
          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-3 w-3 rounded-full',
                    CATEGORY_COLORS[category as ExpenseCategory] || 'bg-gray-500'
                  )} />
                  <span className="font-medium text-foreground">{category}</span>
                </div>
                <span className="text-muted-foreground">
                  ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    CATEGORY_COLORS[category as ExpenseCategory] || 'bg-gray-500'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
