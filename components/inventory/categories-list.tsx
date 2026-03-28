'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getCategories } from '@/lib/storage';
import { Category } from '@/lib/types';
import CategoryForm from './category-form';

interface CategoriesListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

export default function CategoriesList({ selectedId, onSelect, onRefresh }: CategoriesListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCategories(getCategories());
    setMounted(true);

    const interval = setInterval(() => {
      setCategories(getCategories());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 sticky top-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>{categories.length} categories</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 h-8 w-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.id} className="flex gap-2">
            <div
              onClick={() => onSelect(category.id)}
              className={`flex-1 text-left p-3 rounded-lg transition-all border cursor-pointer flex items-center gap-2 ${
                selectedId === category.id
                  ? 'bg-amber-600/20 border-amber-500 dark:bg-amber-600/20'
                  : 'bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600/50'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <p className="font-medium text-slate-900 dark:text-amber-50">{category.name}</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingId(category.id);
                setShowForm(true);
              }}
              className="px-3 h-auto text-xs bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              Edit
            </Button>
          </div>
        ))}

        {categories.length === 0 && (
          <p className="text-center text-slate-400 py-4">No categories yet</p>
        )}
      </CardContent>

      {showForm && (
        <CategoryForm
          categoryId={editingId}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingId(null);
            onRefresh();
          }}
        />
      )}
    </Card>
  );
}
