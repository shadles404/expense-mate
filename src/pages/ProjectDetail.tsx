import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, DollarSign, Pencil, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useExpenses } from '@/hooks/useExpenses';
import { useProjects } from '@/hooks/useProjects';
import { Layout } from '@/components/layout/Layout';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { CategorySummary } from '@/components/expenses/CategorySummary';
import { BudgetIndicator } from '@/components/expenses/BudgetIndicator';
import { ProjectPaymentCard } from '@/components/projects/ProjectPaymentCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { DeleteConfirmDialog } from '@/components/projects/DeleteConfirmDialog';
import { GenerateInvoiceDialog } from '@/components/invoice/GenerateInvoiceDialog';
import { PaymentProjectStatus } from '@/types/expense';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateProject, deleteProject } = useProjects();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? { 
        ...data, 
        budget: Number(data.budget),
        amount_paid: Number(data.amount_paid) || 0,
      } : null;
    },
    enabled: !!id,
  });

  const {
    expenses,
    isLoading: expensesLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    totalCost,
    categoryTotals,
  } = useExpenses(id);

  const handleUpdateProject = async (data: { title: string; budget: number }) => {
    if (!id) return;
    await updateProject.mutateAsync({ id, ...data });
    setIsEditOpen(false);
  };

  const handleRecordPayment = async (amount: number) => {
    if (!id || !project) return;
    const newAmountPaid = (project.amount_paid || 0) + amount;
    
    // Calculate payment status
    let paymentStatus: PaymentProjectStatus = 'unpaid';
    if (newAmountPaid >= totalCost) {
      paymentStatus = 'paid';
    } else if (newAmountPaid > 0) {
      paymentStatus = 'partially_paid';
    }
    
    await updateProject.mutateAsync({ 
      id, 
      amount_paid: newAmountPaid,
      payment_status: paymentStatus,
    });
    
    // Invalidate project query to refresh the data
    queryClient.invalidateQueries({ queryKey: ['project', id] });
    toast.success(`Payment of $${amount.toFixed(2)} recorded`);
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    await deleteProject.mutateAsync(id);
    navigate('/projects');
  };

  const handleExportCSV = () => {
    if (!project || expenses.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['No', 'Description', 'Category', 'Quantity', 'Price', 'Amount'];
    const rows = expenses.map((exp, index) => [
      index + 1,
      exp.description,
      exp.category,
      exp.quantity,
      exp.price,
      (exp.quantity * exp.price).toFixed(2),
    ]);

    rows.push(['', '', '', '', 'Total:', totalCost.toFixed(2)]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  if (projectLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground">Project not found</h2>
          <p className="mt-2 text-muted-foreground">The project you're looking for doesn't exist.</p>
          <Link to="/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                </div>
                {project.budget > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Budget: ${project.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <GenerateInvoiceDialog
                projectId={id!}
                projectTitle={project.title}
                expenses={expenses}
                totalCost={totalCost}
                amountPaid={project.amount_paid || 0}
              />
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDeleteOpen(true)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Budget & Summary */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <BudgetIndicator budget={project.budget} spent={totalCost} />
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Cost</span>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ProjectPaymentCard
            totalCost={totalCost}
            amountPaid={project.amount_paid || 0}
            paymentStatus={project.payment_status || 'unpaid'}
            onRecordPayment={handleRecordPayment}
            isUpdating={updateProject.isPending}
          />
        </div>

        {/* Expense Table */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Expenses</h2>
          <ExpenseTable
            expenses={expenses}
            projectId={id!}
            onAddExpense={(data) => createExpense.mutate(data)}
            onUpdateExpense={(data) => updateExpense.mutate(data)}
            onDeleteExpense={(expenseId) => deleteExpense.mutate(expenseId)}
          />
        </div>

        {/* Category Summary */}
        <CategorySummary categoryTotals={categoryTotals} totalCost={totalCost} />

        {/* Dialogs */}
        <CreateProjectDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={handleUpdateProject}
          isLoading={updateProject.isPending}
          editProject={{ ...project, totalCost, expenseCount: expenses.length, balanceDue: totalCost - (project.amount_paid || 0) }}
        />

        <DeleteConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleDeleteProject}
        />
      </div>
    </Layout>
  );
}
