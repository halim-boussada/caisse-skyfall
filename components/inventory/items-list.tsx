'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getItemsByCategory, deleteMenuItem } from '@/lib/storage';
import { MenuItem } from '@/lib/types';
import { toast } from 'sonner';
import ItemForm from './item-form';

interface ItemsListProps {
  categoryId: string;
  onRefresh: () => void;
}

export default function ItemsList({ categoryId, onRefresh }: ItemsListProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(getItemsByCategory(categoryId));
    setMounted(true);

    const interval = setInterval(() => {
      setItems(getItemsByCategory(categoryId));
    }, 2000);

    return () => clearInterval(interval);
  }, [categoryId]);

  if (!mounted) return null;

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        deleteMenuItem(itemId);
        setItems(getItemsByCategory(categoryId));
        toast.success('Item deleted');
        onRefresh();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Items</CardTitle>
            <CardDescription>{items.length} items in this category</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-600"
          >
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-amber-50">{item.name}</p>
              {item.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold text-green-600 dark:text-green-400 min-w-16 text-right">
                ${item.price.toFixed(2)}
              </p>
              <button
                onClick={() => {
                  setEditingId(item.id);
                  setShowForm(true);
                }}
                className="p-1.5 hover:bg-slate-300 dark:hover:bg-slate-600 rounded transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 hover:bg-slate-300 dark:hover:bg-slate-600 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-center text-slate-400 py-8">
            No items in this category. Create one to get started.
          </p>
        )}
      </CardContent>

      {showForm && (
        <ItemForm
          itemId={editingId}
          categoryId={categoryId}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingId(null);
            setItems(getItemsByCategory(categoryId));
            onRefresh();
          }}
        />
      )}
    </Card>
  );
}
