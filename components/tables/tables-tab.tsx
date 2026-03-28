'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TableGrid from './table-grid';
import TableModal from './table-modal';
import { getTables } from '@/lib/storage';

export default function TablesTab() {
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTables(getTables());
    setMounted(true);

    const interval = setInterval(() => {
      setTables(getTables());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
        <CardHeader>
          <CardTitle>Table Management</CardTitle>
          <CardDescription>Click and hover to create or manage tables. The grid is 20x20.</CardDescription>
        </CardHeader>
        <CardContent>
          <TableGrid onSelectPosition={setSelectedPosition} />
        </CardContent>
      </Card>

      {selectedPosition && (
        <TableModal
          position={selectedPosition}
          onClose={() => setSelectedPosition(null)}
          onTableCreated={() => {
            setTables(getTables());
            setSelectedPosition(null);
          }}
        />
      )}
    </div>
  );
}
