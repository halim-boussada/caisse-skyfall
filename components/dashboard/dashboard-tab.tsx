'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOrders, getTransactions, getTables, getMenuItems } from '@/lib/storage';
import { Order, Transaction, Table, MenuItem } from '@/lib/types';
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, Coffee, Users, ShoppingCart, Clock, ArrowUpDown } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isSameDay, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec489a'];

interface DateRange {
  from: Date;
  to: Date;
}

interface DashboardStats {
  revenue: number;
  ordersCount: number;
  tablesOccupied: number;
  averageOrder: number;
  totalItems: number;
  previousRevenue: number;
  revenueChange: number;
  previousOrders: number;
  ordersChange: number;
}

export default function DashboardTab() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date()
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous' | 'previous_day' | 'previous_week' | 'previous_month'>('previous');
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    ordersCount: 0,
    tablesOccupied: 0,
    averageOrder: 0,
    totalItems: 0,
    previousRevenue: 0,
    revenueChange: 0,
    previousOrders: 0,
    ordersChange: 0
  });
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = () => {
    const allOrders = getOrders();
    const allTransactions = getTransactions();
    const tables = getTables();
    const items = getMenuItems();

    // Filter orders and transactions by date range
    const startTime = startOfDay(dateRange.from).getTime();
    const endTime = endOfDay(dateRange.to).getTime();
    
    const filteredOrders = allOrders.filter(order => 
      order.createdAt >= startTime && order.createdAt <= endTime
    );
    
    const filteredTransactions = allTransactions.filter(txn => 
      txn.timestamp >= startTime && txn.timestamp <= endTime
    );

    // Calculate stats
    const revenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const ordersCount = filteredOrders.length;
    const totalItems = filteredOrders.reduce((sum, order) => sum + order.items.length, 0);
    const averageOrder = ordersCount > 0 ? revenue / ordersCount : 0;
    
    // Occupied tables (from all tables, not date filtered)
    const tablesOccupied = tables.filter(t => t.status === 'occupied').length;

    // Calculate previous period stats for comparison
    let previousStartTime: number, previousEndTime: number;
    const daysDiff = differenceInDays(dateRange.to, dateRange.from) + 1;
    
    if (comparisonPeriod === 'previous') {
      previousStartTime = startOfDay(subDays(dateRange.from, daysDiff)).getTime();
      previousEndTime = endOfDay(subDays(dateRange.to, daysDiff)).getTime();
    } else if (comparisonPeriod === 'previous_day') {
      previousStartTime = startOfDay(subDays(dateRange.from, 1)).getTime();
      previousEndTime = endOfDay(subDays(dateRange.to, 1)).getTime();
    } else if (comparisonPeriod === 'previous_week') {
      previousStartTime = startOfDay(subDays(dateRange.from, 7)).getTime();
      previousEndTime = endOfDay(subDays(dateRange.to, 7)).getTime();
    } else {
      previousStartTime = startOfDay(subDays(dateRange.from, 30)).getTime();
      previousEndTime = endOfDay(subDays(dateRange.to, 30)).getTime();
    }

    const previousOrders = allOrders.filter(order => 
      order.createdAt >= previousStartTime && order.createdAt <= previousEndTime
    );
    const previousTransactions = allTransactions.filter(txn => 
      txn.timestamp >= previousStartTime && txn.timestamp <= previousEndTime
    );
    const previousRevenue = previousTransactions.reduce((sum, t) => sum + t.amount, 0);

    const revenueChange = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
    const ordersChange = previousOrders.length > 0 ? ((ordersCount - previousOrders.length) / previousOrders.length) * 100 : 0;

    setStats({
      revenue,
      ordersCount,
      tablesOccupied,
      averageOrder,
      totalItems,
      previousRevenue,
      revenueChange,
      previousOrders: previousOrders.length,
      ordersChange
    });

    // Hourly data (for single day view)
    if (isSameDay(dateRange.from, dateRange.to)) {
      const hourlyRevenue = Array(24).fill(0).map((_, hour) => ({
        hour,
        revenue: 0,
        orders: 0,
        time: `${hour.toString().padStart(2, '0')}:00`
      }));
      
      filteredTransactions.forEach(txn => {
        const hour = new Date(txn.timestamp).getHours();
        hourlyRevenue[hour].revenue += txn.amount;
      });
      
      filteredOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourlyRevenue[hour].orders++;
      });
      
      setHourlyData(hourlyRevenue);
    } else {
      // Daily data for multi-day view
      const dailyMap = new Map<string, { date: string; revenue: number; orders: number }>();
      
      filteredTransactions.forEach(txn => {
        const dateKey = format(new Date(txn.timestamp), 'MMM dd');
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0 });
        }
        dailyMap.get(dateKey)!.revenue += txn.amount;
      });
      
      filteredOrders.forEach(order => {
        const dateKey = format(new Date(order.createdAt), 'MMM dd');
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0 });
        }
        dailyMap.get(dateKey)!.orders++;
      });
      
      setDailyData(Array.from(dailyMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    }

    // Top items
    const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales.has(item.menuItemId)) {
          const menuItem = items.find(i => i.id === item.menuItemId);
          itemSales.set(item.menuItemId, {
            name: item.itemName || menuItem?.name || 'Unknown',
            quantity: 0,
            revenue: 0
          });
        }
        const sales = itemSales.get(item.menuItemId)!;
        sales.quantity += item.quantity;
        sales.revenue += item.quantity * item.unitPrice;
      });
    });
    
    setTopItems(Array.from(itemSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
    );

    // Category breakdown
    const categoryMap = new Map<string, { name: string; revenue: number; orders: number }>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const categoryId = item.categoryName;
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, { name: `Category ${categoryId}`, revenue: 0, orders: 0 });
        }
        const cat = categoryMap.get(categoryId)!;
        cat.revenue += item.quantity * item.unitPrice;
        cat.orders++;
      });
    });
    
    setCategoryBreakdown(Array.from(categoryMap.values()).slice(0, 6));

    // Recent transactions
    setRecentTransactions(filteredTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(txn => {
        const order = allOrders.find(o => o.id === txn.orderId);
        return {
          ...txn,
          tableNumber: order?.tableNumber,
          time: format(new Date(txn.timestamp), 'HH:mm'),
          date: format(new Date(txn.timestamp), 'MMM dd')
        };
      })
    );
  };

  if (!mounted) {
    setMounted(true);
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => range && setDateRange({ from: range.from!, to: range.to || range.from! })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Select value={comparisonPeriod} onValueChange={(v: any) => setComparisonPeriod(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Compare to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous Period</SelectItem>
              <SelectItem value="previous_day">Previous Day</SelectItem>
              <SelectItem value="previous_week">Previous Week</SelectItem>
              <SelectItem value="previous_month">Previous Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDateRange({ from: new Date(), to: new Date() })}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>
            Last 7 Days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          change={stats.revenueChange}
          icon={DollarSign}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-500/10"
        />
        <StatsCard
          title="Orders"
          value={stats.ordersCount}
          change={stats.ordersChange}
          icon={ShoppingCart}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-500/10"
        />
        <StatsCard
          title="Average Order"
          value={`$${stats.averageOrder.toFixed(2)}`}
          change={0}
          icon={Coffee}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-100 dark:bg-amber-500/10"
        />
        <StatsCard
          title="Items Sold"
          value={stats.totalItems}
          change={0}
          icon={TrendingUp}
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-100 dark:bg-purple-500/10"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
          <CardHeader>
            <CardTitle>{isSameDay(dateRange.from, dateRange.to) ? 'Hourly Revenue' : 'Daily Revenue'}</CardTitle>
            <CardDescription>
              {isSameDay(dateRange.from, dateRange.to) 
                ? 'Revenue breakdown by hour' 
                : `Revenue from ${format(dateRange.from, 'MMM dd')} to ${format(dateRange.to, 'MMM dd')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {isSameDay(dateRange.from, dateRange.to) ? (
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    formatter={(v: any) => `$${v.toFixed(2)}`}
                  />
                  <Bar dataKey="revenue" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    formatter={(v: any) => `$${v.toFixed(2)}`}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24' }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    formatter={(v: any) => `$${v.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Items */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>Most popular items this period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topItems.length > 0 ? (
              topItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-amber-50">{item.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">×{item.quantity} sold</p>
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400">${item.revenue.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">No sales in this period</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest payments in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((txn) => (
                  <div key={txn.id} className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
                        <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-amber-50">
                          Table {txn.tableNumber || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {txn.date} at {txn.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">${txn.amount.toFixed(2)}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{txn.paymentMethod}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">No transactions in this period</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, change, icon: Icon, color, bgColor }: any) {
  const isPositive = change > 0;
  
  return (
    <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-amber-50">{value}</p>
            {change !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(change).toFixed(1)}% vs previous</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}