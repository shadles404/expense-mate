import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetIndicatorProps {
  budget: number;
  spent: number;
}

export function BudgetIndicator({ budget, spent }: BudgetIndicatorProps) {
  if (budget <= 0) return null;

  const percentage = Math.min((spent / budget) * 100, 100);
  const remaining = budget - spent;
  const isOverBudget = spent > budget;
  const isNearBudget = percentage >= 80 && percentage < 100;

  return (
    <div className={cn(
      "rounded-xl border p-6 animate-fade-in",
      isOverBudget 
        ? "border-destructive/50 bg-destructive/5" 
        : isNearBudget 
          ? "border-warning/50 bg-warning/5" 
          : "border-success/50 bg-success/5"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isOverBudget ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : isNearBudget ? (
            <TrendingUp className="h-5 w-5 text-warning" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-success" />
          )}
          <span className="font-semibold text-foreground">Budget Status</span>
        </div>
        <span className={cn(
          "text-sm font-medium px-2 py-1 rounded-full",
          isOverBudget 
            ? "bg-destructive/10 text-destructive" 
            : isNearBudget 
              ? "bg-warning/10 text-warning" 
              : "bg-success/10 text-success"
        )}>
          {isOverBudget ? 'Over Budget' : isNearBudget ? 'Near Limit' : 'On Track'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            ${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ${budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className={cn(
            "font-medium",
            isOverBudget ? "text-destructive" : "text-muted-foreground"
          )}>
            {percentage.toFixed(1)}%
          </span>
        </div>

        <Progress 
          value={percentage} 
          className={cn(
            "h-3",
            isOverBudget 
              ? "[&>div]:bg-destructive" 
              : isNearBudget 
                ? "[&>div]:bg-warning" 
                : "[&>div]:bg-success"
          )} 
        />

        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-muted-foreground">
            {isOverBudget ? 'Exceeded by' : 'Remaining'}
          </span>
          <span className={cn(
            "text-lg font-bold",
            isOverBudget ? "text-destructive" : "text-success"
          )}>
            {isOverBudget ? '-' : ''}${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
