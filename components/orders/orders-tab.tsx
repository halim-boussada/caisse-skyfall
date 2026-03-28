'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getOrders } from '@/lib/storage';
import { Order } from '@/lib/types';
import OrdersTable from './orders-table';
import OrderDetailModal from './order-detail-modal';
import CreateOrderModal from './create-order-modal';

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'canceled'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadOrders = () => {
      const allOrders = getOrders();
      setOrders(allOrders);
    };

    loadOrders();
    setMounted(true);

    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') return order.status === 'active';
    if (filter === 'completed') return order.status === 'completed';
    if (filter === 'canceled') return order.status === 'canceled';
    return true;
  });
  
  // Sort orders by createdAt descending (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => b.createdAt - a.createdAt);

  // Get counts for each status
  const counts = {
    all: orders.length,
    active: orders.filter(o => o.status === 'active').length,
    completed: orders.filter(o => o.status === 'completed').length,
    canceled: orders.filter(o => o.status === 'canceled').length,
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Click an order to view details and manage payments</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-600 hover:bg-amber-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Order
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(['all', 'active', 'completed', 'canceled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === f
                    ? 'bg-amber-600 text-white dark:bg-amber-600'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>

          <OrdersTable 
            orders={sortedOrders}
            onSelectOrder={setSelectedOrder}
            onRefresh={() => setOrders(getOrders())}
          />
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={() => {
            setOrders(getOrders());
            setSelectedOrder(null);
          }}
        />
      )}

      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={() => {
            setOrders(getOrders());
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}