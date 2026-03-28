'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    hour: number;
    revenue: number;
    orders: number;
  }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map(item => ({
    ...item,
    time: `${item.hour}:00`,
  }));

  return (
    <Card className="bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700">
      <CardHeader>
        <CardTitle>Hourly Revenue</CardTitle>
        <CardDescription>Revenue by hour today</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `$${value.toFixed(2)}`}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="revenue" fill="#fbbf24" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
