import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FolderOpen, Calendar, DollarSign, AlertTriangle, TrendingUp, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { ProjectWithTotals } from '@/types/expense';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
  project: ProjectWithTotals;
  onEdit: (project: ProjectWithTotals) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const budgetUsedPercent = project.budget > 0 
    ? Math.min((project.totalCost / project.budget) * 100, 100) 
    : 0;
  const isOverBudget = project.totalCost > project.budget && project.budget > 0;
  const remaining = project.budget - project.totalCost;

  return (
    <div className="stat-card group relative animate-fade-in">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <PaymentStatusBadge status={project.payment_status} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(project.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link to={`/projects/${project.id}`} className="block">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
            isOverBudget ? "gradient-danger" : "gradient-primary"
          )}>
            <FolderOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate pr-24">
              {project.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(project.created_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Spent</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              isOverBudget ? "text-destructive" : "text-foreground"
            )}>
              ${project.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid:</span>
              <span className="text-green-600 font-medium">
                ${project.amount_paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance:</span>
              <span className={cn("font-medium", project.balanceDue > 0 ? "text-red-600" : "text-foreground")}>
                ${project.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {project.budget > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Progress</span>
                  <span className={cn(
                    "font-medium",
                    isOverBudget ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {budgetUsedPercent.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={budgetUsedPercent} 
                  className={cn(
                    "h-2",
                    isOverBudget && "[&>div]:bg-destructive"
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  {isOverBudget ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-success" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isOverBudget ? 'Over Budget' : 'Remaining'}
                  </span>
                </div>
                <span className={cn(
                  "font-semibold",
                  isOverBudget ? "text-destructive" : "text-success"
                )}>
                  {isOverBudget ? '-' : ''}${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>{project.expenseCount} expense{project.expenseCount !== 1 ? 's' : ''}</span>
            <span className="text-primary font-medium group-hover:underline">View Details →</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
