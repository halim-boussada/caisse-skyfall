'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addCategory, getCategories, updateCategory, deleteCategory } from '@/lib/storage';
import { toast } from 'sonner';

interface CategoryFormProps {
  categoryId: string | null;
  onClose: () => void;
  onSave: () => void;
}

const COLORS = [
  '#8B4513', // Coffee brown
  '#2d5016', // Tea green
  '#CD853F', // Pastry
  '#6B4226', // Dark brown
  '#9B5D1F', // Medium brown
  '#4A3F35', // Very dark brown
  '#D4A574', // Light brown
];

export default function CategoryForm({ categoryId, onClose, onSave }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryId) {
      const categories = getCategories();
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setName(category.name);
        setColor(category.color);
      }
    }
  }, [categoryId]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setLoading(true);
    try {
      if (categoryId) {
        updateCategory(categoryId, { name, color });
        toast.success('Category updated');
      } else {
        const newCategory = {
          id: `category-${Date.now()}`,
          name,
          color,
          createdAt: Date.now(),
        };
        addCategory(newCategory);
        toast.success('Category created');
      }
      onSave();
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryId) return;

    if (confirm('Are you sure? This will not delete associated items.')) {
      setLoading(true);
      try {
        deleteCategory(categoryId);
        toast.success('Category deleted');
        onSave();
      } catch (error) {
        toast.error('Failed to delete category');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle>{categoryId ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogDescription>
            {categoryId ? 'Update category details' : 'Create a new category for items'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-amber-50 mb-2 block">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Coffee, Tea, Pastries"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label className="text-amber-50 mb-2 block">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    color === c ? 'border-white scale-110' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              Cancel
            </Button>
            {categoryId && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
