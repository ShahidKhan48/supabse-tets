import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CategoryData {
  category: string;
  count: number;
  intensity: number;
}

interface CategoryHeatmapProps {
  data: CategoryData[];
  title?: string;
  description?: string;
}

export const CategoryHeatmap: React.FC<CategoryHeatmapProps> = ({ 
  data, 
  title = "Issues by Category Heatmap",
  description = "Volume of issues per category within the selected period"
}) => {
  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500 text-white';
    if (intensity >= 60) return 'bg-red-400 text-white';
    if (intensity >= 40) return 'bg-orange-400 text-white';
    if (intensity >= 20) return 'bg-yellow-400 text-black';
    return 'bg-green-200 text-black';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 80) return 'Very High';
    if (intensity >= 60) return 'High';
    if (intensity >= 40) return 'Medium';
    if (intensity >= 20) return 'Low';
    return 'Very Low';
  };

  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...data.map(item => item.count));
  const totalTickets = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Heatmap Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedData.map((item, index) => {
              const percentage = totalTickets > 0 ? (item.count / totalTickets) * 100 : 0;
              return (
                <div 
                  key={item.category}
                  className={`p-4 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer ${getIntensityColor(item.intensity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate">
                      {item.category}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {item.count}
                    </div>
                    <div className="text-xs opacity-90">
                      {percentage.toFixed(1)}% of total
                    </div>
                    <div className="text-xs font-medium">
                      {getIntensityLabel(item.intensity)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6">
            <h4 className="font-medium mb-3 text-sm">Intensity Legend</h4>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">Very High (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span className="text-sm">High (60-79%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                <span className="text-sm">Medium (40-59%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-sm">Low (20-39%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 rounded"></div>
                <span className="text-sm">Very Low (&lt;20%)</span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {data.length}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">
                {totalTickets}
              </div>
              <div className="text-sm text-muted-foreground">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-secondary">
                {maxCount}
              </div>
              <div className="text-sm text-muted-foreground">Highest Count</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-accent">
                {data.length > 0 ? (totalTickets / data.length).toFixed(1) : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Average per Category</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};