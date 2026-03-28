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
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
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
    return true;
  });
  const sortedOrders = [...filteredOrders].sort((a, b) => b.createdAt - a.createdAt);


  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Click an order to view details and manage payments</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-600 hover:bg-amber-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Order
              </Button>
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-amber-600 text-white dark:bg-amber-600'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({
                    orders.filter(o => {
                      if (f === 'active') return o.status === 'active';
                      if (f === 'completed') return o.status === 'completed';
                      return true;
                    }).length
                  })
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
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
