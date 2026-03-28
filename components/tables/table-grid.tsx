'use client';

import { useEffect, useState } from 'react';
import { getTables, getOrdersByTable } from '@/lib/storage';
import { Table } from '@/lib/types';
import TableCell from './table-cell';

interface TableGridProps {
  onSelectPosition: (pos: { x: number; y: number }) => void;
}

const GRID_SIZE = 10;

export default function TableGrid({ onSelectPosition }: TableGridProps) {
  const [tables, setTables] = useState<Table[]>([]);
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

  const getTableAtPosition = (x: number, y: number) => {
    return tables.find(t => t.gridX === x && t.gridY === y);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="inline-grid gap-2 p-4 bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE * 2}, minmax(50px, 1fr))`,
          minWidth: 'fit-content',
        }}
      >
        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((_, x) => {
            const table = getTableAtPosition(x, y);

            return (
              <div key={`${x}-${y}`}>
                <TableCell
                  table={table}
                  x={x}
                  y={y}
                  onSelect={() => {
                    if (table) {
                      // Open existing table
                      onSelectPosition({ x, y });
                    } else {
                      // Create new table
                      onSelectPosition({ x, y });
                    }
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
