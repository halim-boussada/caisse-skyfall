'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Coffee, TrendingUp, Users, ShoppingCart } from 'lucide-react';

interface StatsCardsProps {
  revenue: number;
  ordersCount: number;
  tablesOccupied: number;
  averageOrder: number;
}

export default function StatsCards({ 
  revenue, 
  ordersCount, 
  tablesOccupied, 
  averageOrder 
}: StatsCardsProps) {
  const stats = [
    {
      title: 'Revenue Today',
      value: `$${revenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-500/10',
    },
    {
      title: 'Orders Completed',
      value: ordersCount,
      icon: ShoppingCart,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-500/10',
    },
    {
      title: 'Tables Occupied',
      value: tablesOccupied,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-500/10',
    },
    {
      title: 'Average Check',
      value: `$${averageOrder.toFixed(2)}`,
      icon: Coffee,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{stat.title}</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-amber-50">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
