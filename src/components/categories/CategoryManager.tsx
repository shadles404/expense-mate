import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Tag } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const COLORS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Gray', value: 'bg-gray-500' },
];

export function CategoryManager() {
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('bg-gray-500');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCategory.mutate({ name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor('bg-gray-500');
  };

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateCategory.mutate({ id: editingId, name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteCategory.mutate(id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tag className="h-4 w-4" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Expense Categories</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new category */}
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Select value={newColor} onValueChange={setNewColor}>
              <SelectTrigger className="w-24">
                <div className={cn('h-4 w-4 rounded-full', newColor)} />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn('h-4 w-4 rounded-full', color.value)} />
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" onClick={handleCreate} disabled={!newName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Category list */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card"
              >
                {editingId === category.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Select value={editColor} onValueChange={setEditColor}>
                      <SelectTrigger className="w-16 h-8">
                        <div className={cn('h-3 w-3 rounded-full', editColor)} />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn('h-3 w-3 rounded-full', color.value)} />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className={cn('h-4 w-4 rounded-full shrink-0', category.color)} />
                    <span className="flex-1 font-medium">{category.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleStartEdit(category.id, category.name, category.color)}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
