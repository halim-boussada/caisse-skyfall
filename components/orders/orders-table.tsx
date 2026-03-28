'use client';

import { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';

interface OrdersTableProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onRefresh: () => void;
}

export default function OrdersTable({ orders, onSelectOrder, onRefresh }: OrdersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  // Group orders by day
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const dayKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      groups[dayKey].push(order);
    });
    
    // Sort days in descending order (newest first)
    const sortedDays = Object.keys(groups).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
    
    return { groups, sortedDays };
  }, [orders]);

  // Paginate days
  const paginatedDays = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return groupedOrders.sortedDays.slice(startIndex, endIndex);
  }, [groupedOrders.sortedDays, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(groupedOrders.sortedDays.length / itemsPerPage);

  const toggleDay = (dayKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  const expandAll = () => {
    const allDays = new Set(groupedOrders.sortedDays);
    setExpandedDays(allDays);
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  const getStatusBadge = (status: string, totalAmount: number, totalPaid: number) => {
    if (status === 'canceled') {
      return <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs rounded">Canceled</span>;
    }
    if (status === 'completed') {
      return <span className="px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded">Completed</span>;
    }
    if (totalPaid >= totalAmount) {
      return <span className="px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded">Paid</span>;
    }
    if (totalPaid > 0) {
      return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs rounded">Partial</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs rounded">Open</span>;
  };

  const getDaySummary = (dayOrders: Order[]) => {
    const totalOrders = dayOrders.length;
    const totalRevenue = dayOrders.reduce((sum, order) => sum + (order.status !== 'canceled' ? order.totalAmount : 0), 0);
    const totalPaid = dayOrders.reduce((sum, order) => sum + order.totalPaid, 0);
    const completedOrders = dayOrders.filter(o => o.status === 'completed').length;
    const canceledOrders = dayOrders.filter(o => o.status === 'canceled').length;
    
    return { totalOrders, totalRevenue, totalPaid, completedOrders, canceledOrders };
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No orders to display
      </div>
    );
  }

  if (groupedOrders.sortedDays.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No orders found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Expand/Collapse Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="text-xs"
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="text-xs"
          >
            Collapse All
          </Button>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total: {orders.length} orders
        </div>
      </div>

      {/* Orders by Day */}
      <div className="space-y-6">
        {paginatedDays.map((dayKey) => {
          const dayOrders = groupedOrders.groups[dayKey];
          const summary = getDaySummary(dayOrders);
          const isExpanded = expandedDays.has(dayKey);
          
          return (
            <div key={dayKey} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {/* Day Header */}
              <div
                className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleDay(dayKey)}
              >
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDay(dayKey);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {dayKey}
                    </h3>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {summary.totalOrders} order{summary.totalOrders !== 1 ? 's' : ''}
                    </span>
                    {summary.canceledOrders > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        {summary.canceledOrders} canceled
                      </span>
                    )}
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      ${summary.totalRevenue.toFixed(2)}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      ${summary.totalPaid.toFixed(2)} paid
                    </span>
                  </div>
                </div>
              </div>

              {/* Orders Table for this Day */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-300">Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-300">Table</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-300">Items</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-300">Total</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-300">Paid</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900 dark:text-slate-300">Status</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900 dark:text-slate-300">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${
                            order.status === 'canceled' ? 'bg-red-50 dark:bg-red-900/10' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <p className="text-slate-600 dark:text-slate-400 text-xs">
                              {new Date(order.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className={`font-semibold ${
                              order.status === 'canceled' 
                                ? 'text-slate-500 dark:text-slate-500 line-through' 
                                : 'text-slate-900 dark:text-amber-50'
                            }`}>
                              Table {order.tableNumber}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className={`${
                              order.status === 'canceled' 
                                ? 'text-slate-500 dark:text-slate-500 line-through' 
                                : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {order.items.length} item(s)
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className={`font-semibold ${
                              order.status === 'canceled' 
                                ? 'text-slate-500 dark:text-slate-500 line-through' 
                                : 'text-slate-900 dark:text-white'
                            }`}>
                              ${order.totalAmount.toFixed(2)}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className={order.totalPaid > 0 && order.status !== 'canceled' 
                              ? 'font-semibold text-green-600 dark:text-green-400' 
                              : 'text-slate-500 dark:text-slate-400'
                            }>
                              ${order.totalPaid.toFixed(2)}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getStatusBadge(order.status, order.totalAmount, order.totalPaid)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSelectOrder(order)}
                              className="hover:bg-slate-200 dark:hover:bg-slate-600"
                              disabled={order.status === 'canceled'}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}