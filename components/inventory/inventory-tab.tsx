'use client';

import { useState, useEffect } from 'react';
import { getCategories } from '@/lib/storage';
import CategoriesList from './categories-list';
import ItemsList from './items-list';

export default function InventoryTab() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const cats = getCategories();
    setCategories(cats);
    if (cats.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(cats[0].id);
    }
    setMounted(true);
  }, [refreshTrigger]);

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div>
        <CategoriesList 
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onRefresh={() => {
            setRefreshTrigger(t => t + 1);
            setCategories(getCategories());
          }}
        />
      </div>

      <div className="lg:col-span-2">
        {selectedCategoryId ? (
          <ItemsList 
            categoryId={selectedCategoryId}
            onRefresh={() => setRefreshTrigger(t => t + 1)}
          />
        ) : (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            Select or create a category to manage items
          </div>
        )}
      </div>
    </div>
  );
}
