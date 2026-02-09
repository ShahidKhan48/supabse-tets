import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface SLAChartData {
  date: string;
  breaches: number;
  total: number;
  percentage: number;
}

interface SLALineChartProps {
  data: SLAChartData[];
  title?: string;
  description?: string;
  detailed?: boolean;
}

export const SLALineChart: React.FC<SLALineChartProps> = ({ 
  data, 
  title = "SLA Breaches Over Time",
  description = "SLA breach analysis over the selected period",
  detailed = false
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const totalBreaches = data.reduce((sum, item) => sum + item.breaches, 0);
  const totalTickets = data.reduce((sum, item) => sum + item.total, 0);
  const averageBreachRate = totalTickets > 0 ? (totalBreaches / totalTickets) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{formatDate(label)}</p>
          <p className="text-sm text-destructive">
            SLA Breaches: {data.breaches}
          </p>
          <p className="text-sm text-muted-foreground">
            Total Tickets: {data.total}
          </p>
          <p className="text-sm font-medium">
            Breach Rate: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const getSLAStatus = () => {
    if (averageBreachRate <= 5) return { status: "Excellent", variant: "default" as const };
    if (averageBreachRate <= 15) return { status: "Good", variant: "secondary" as const };
    if (averageBreachRate <= 25) return { status: "Needs Attention", variant: "outline" as const };
    return { status: "Critical", variant: "destructive" as const };
  };

  const slaStatus = getSLAStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={slaStatus.variant}>
            {slaStatus.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {detailed ? (
              <ComposedChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="breaches" 
                  name="SLA Breaches" 
                  fill="hsl(var(--destructive))" 
                  opacity={0.7}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="percentage" 
                  name="Breach Rate (%)"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--destructive))', r: 4 }}
                />
              </ComposedChart>
            ) : (
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="breaches" 
                  name="SLA Breaches"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  name="Breach Rate (%)"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {totalBreaches}
            </div>
            <div className="text-sm text-muted-foreground">Total Breaches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {totalTickets}
            </div>
            <div className="text-sm text-muted-foreground">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {averageBreachRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Breach Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};