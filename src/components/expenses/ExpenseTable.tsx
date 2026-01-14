import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const CATEGORIES: ExpenseCategory[] = [
  'Materials',
  'Labor',
  'Marketing',
  'Equipment',
  'Transportation',
  'Utilities',
  'Wedding',
  'Other',
];

interface ExpenseTableProps {
  expenses: Expense[];
  projectId: string;
  onAddExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateExpense: (expense: Partial<Expense> & { id: string }) => void;
  onDeleteExpense: (id: string) => void;
}

export function ExpenseTable({
  expenses,
  projectId,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: ExpenseTableProps) {
  const [newExpense, setNewExpense] = useState({
    description: '',
    quantity: 1,
    price: 0,
    category: 'Other' as ExpenseCategory,
  });

  const handleAddExpense = () => {
    if (!newExpense.description.trim()) return;
    
    onAddExpense({
      project_id: projectId,
      description: newExpense.description,
      quantity: newExpense.quantity,
      price: newExpense.price,
      category: newExpense.category,
    });

    setNewExpense({
      description: '',
      quantity: 1,
      price: 0,
      category: 'Other',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddExpense();
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="table-header hover:bg-transparent">
            <TableHead className="w-16">No</TableHead>
            <TableHead className="min-w-[200px]">Description</TableHead>
            <TableHead className="w-32">Category</TableHead>
            <TableHead className="w-24 text-right">Qty</TableHead>
            <TableHead className="w-32 text-right">Price</TableHead>
            <TableHead className="w-32 text-right">Amount</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense, index) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              index={index + 1}
              onUpdate={onUpdateExpense}
              onDelete={onDeleteExpense}
            />
          ))}
          
          {/* Add new expense row */}
          <TableRow className="bg-muted/30">
            <TableCell className="text-muted-foreground font-medium">
              {expenses.length + 1}
            </TableCell>
            <TableCell>
              <Input
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder="Enter description"
                className="h-9 input-focus"
              />
            </TableCell>
            <TableCell>
              <Select
                value={newExpense.category}
                onValueChange={(value: ExpenseCategory) => setNewExpense({ ...newExpense, category: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newExpense.quantity}
                onChange={(e) => setNewExpense({ ...newExpense, quantity: parseFloat(e.target.value) || 0 })}
                onKeyPress={handleKeyPress}
                className="h-9 text-right input-focus"
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newExpense.price}
                onChange={(e) => setNewExpense({ ...newExpense, price: parseFloat(e.target.value) || 0 })}
                onKeyPress={handleKeyPress}
                className="h-9 text-right input-focus"
              />
            </TableCell>
            <TableCell className="text-right font-medium text-muted-foreground">
              ${(newExpense.quantity * newExpense.price).toFixed(2)}
            </TableCell>
            <TableCell>
              <Button
                size="icon"
                onClick={handleAddExpense}
                disabled={!newExpense.description.trim()}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

interface ExpenseRowProps {
  expense: Expense;
  index: number;
  onUpdate: (expense: Partial<Expense> & { id: string }) => void;
  onDelete: (id: string) => void;
}

function ExpenseRow({ expense, index, onUpdate, onDelete }: ExpenseRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    description: expense.description,
    quantity: expense.quantity,
    price: expense.price,
    category: expense.category,
  });

  const amount = expense.quantity * expense.price;

  const handleBlur = (field: string, value: string | number | ExpenseCategory) => {
    const updateData: Partial<Expense> & { id: string } = {
      id: expense.id,
      [field]: value,
    };
    onUpdate(updateData);
  };

  return (
    <TableRow className="group animate-fade-in">
      <TableCell className="font-medium text-muted-foreground">{index}</TableCell>
      <TableCell>
        <Input
          value={editValues.description}
          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
          onBlur={(e) => handleBlur('description', e.target.value)}
          className="h-9 border-transparent bg-transparent hover:border-input focus:border-input input-focus"
        />
      </TableCell>
      <TableCell>
        <Select
          value={editValues.category}
          onValueChange={(value: ExpenseCategory) => {
            setEditValues({ ...editValues, category: value });
            handleBlur('category', value);
          }}
        >
          <SelectTrigger className="h-9 border-transparent bg-transparent hover:border-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={editValues.quantity}
          onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) || 0 })}
          onBlur={(e) => handleBlur('quantity', parseFloat(e.target.value) || 0)}
          className="h-9 text-right border-transparent bg-transparent hover:border-input focus:border-input input-focus"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={editValues.price}
          onChange={(e) => setEditValues({ ...editValues, price: parseFloat(e.target.value) || 0 })}
          onBlur={(e) => handleBlur('price', parseFloat(e.target.value) || 0)}
          className="h-9 text-right border-transparent bg-transparent hover:border-input focus:border-input input-focus"
        />
      </TableCell>
      <TableCell className="text-right font-semibold">
        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </TableCell>
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(expense.id)}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
