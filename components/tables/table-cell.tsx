'use client';

import { Table } from '@/lib/types';
import { getOrdersByTable } from '@/lib/storage';

interface TableCellProps {
  table?: Table;
  x: number;
  y: number;
  onSelect: () => void;
}

export default function TableCell({ table, x, y, onSelect }: TableCellProps) {
  const orders = table ? getOrdersByTable(table.id) : [];
  const hasActiveOrder = orders.length > 0;

  const getStatusColor = () => {
    if (!table) return 'bg-slate-700 hover:bg-slate-600 border-slate-600';
    
    switch (table.status) {
      case 'occupied':
        return 'bg-blue-600 hover:bg-blue-500 border-blue-500';
      case 'reserved':
        return 'bg-orange-600 hover:bg-orange-500 border-orange-500';
      default:
        return 'bg-green-600 hover:bg-green-500 border-green-500';
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`
        w-full h-12 rounded-lg border transition-all duration-200
        font-medium text-sm flex items-center justify-center gap-1
        relative group
        ${getStatusColor()}
        ${!table ? 'text-slate-400' : 'text-white'}
      `}
      title={
        table
          ? `Table ${table.number} - ${table.status}`
          : `Position (${x}, ${y}) - Click to create`
      }
    >
      {table ? (
        <>
          <span className="font-bold">{table.number}</span>
          {hasActiveOrder && (
            <span className="text-xs bg-red-500 px-1 rounded">
              {orders[0]?.items.length || 0}
            </span>
          )}
        </>
      ) : (
        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          +
        </span>
      )}
    </button>
  );
}
