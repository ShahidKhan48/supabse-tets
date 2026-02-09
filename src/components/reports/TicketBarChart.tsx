import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface TicketChartData {
  date: string;
  created: number;
  closed: number;
}

interface TicketBarChartProps {
  data: TicketChartData[];
  title?: string;
  description?: string;
}

export const TicketBarChart: React.FC<TicketBarChartProps> = ({ 
  data, 
  title = "Tickets Created vs Closed",
  description = "Comparison of ticket creation and closure over time"
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Custom bar shape with conditional outline
  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, payload } = props;
    const hasMismatch = payload.created !== payload.closed;
    
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={hasMismatch ? "hsl(var(--warning))" : "transparent"}
        strokeWidth={hasMismatch ? 2 : 0}
        rx={2}
        ry={2}
      />
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.date === label);
      const hasMismatch = dataPoint && dataPoint.created !== dataPoint.closed;
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
          {hasMismatch && (
            <p className="text-xs text-warning font-medium mt-1">⚠ Mismatch detected</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              <Bar 
                dataKey="created" 
                name="Created" 
                fill="hsl(var(--primary))" 
                radius={[2, 2, 0, 0]}
                shape={<CustomBar />}
              />
              <Bar 
                dataKey="closed" 
                name="Closed" 
                fill="hsl(var(--accent))" 
                radius={[2, 2, 0, 0]}
                shape={<CustomBar />}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {data.reduce((sum, item) => sum + item.created, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {data.reduce((sum, item) => sum + item.closed, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Closed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};