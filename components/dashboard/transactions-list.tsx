'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTransactions, getOrders } from '@/lib/storage';
import { Transaction, Order } from '@/lib/types';

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<(Transaction & { tableNumber?: number })[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const txns = getTransactions();
      const orders = getOrders();
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const todayTxns = txns
        .filter(t => t.timestamp >= startOfDay)
        .map(t => {
          const order = orders.find(o => o.id === t.orderId);
          return {
            ...t,
            tableNumber: order?.tableNumber,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 8);

      setTransactions(todayTxns);
    };

    loadData();
    setMounted(true);

    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest payments today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((txn) => (
              <div key={txn.id} className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-amber-50">
                    Table {txn.tableNumber || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {new Date(txn.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">${txn.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{txn.paymentMethod}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No transactions yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
