import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Filter, Download, RefreshCw } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useViewMode } from '@/contexts/ViewModeContext';

import { TicketBarChart } from '@/components/reports/TicketBarChart';
import { SLALineChart } from '@/components/reports/SLALineChart';
import { CategoryHeatmap } from '@/components/reports/CategoryHeatmap';
import { AgentTicketReport } from '@/components/reports/AgentTicketReport';
import { useReportsData } from '@/hooks/useReportsData';
import { 
  fetchTicketsForExport, 
  formatTicketForExport, 
  exportToCSV, 
  exportToXLSX, 
  generateExportFilename 
} from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

export interface ReportFilters {
  dateRange: DateRange | undefined;
  agentId?: string;
  teamId?: string;
  categoryId?: string;
  urgencyId?: string;
}

const Reports = () => {
  const { compactMode } = useViewMode();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: addDays(new Date(), -30),
      to: new Date()
    }
  });

  const { 
    ticketsData, 
    slaData, 
    categoryData, 
    agentData, 
    users, 
    categories, 
    urgencyLevels,
    isLoading, 
    refetch 
  } = useReportsData(filters);

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setFilters(prev => ({ ...prev, dateRange }));
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? undefined : value 
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        from: addDays(new Date(), -30),
        to: new Date()
      }
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.agentId) count++;
    if (filters.teamId) count++;
    if (filters.categoryId) count++;
    if (filters.urgencyId) count++;
    return count;
  }, [filters]);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    try {
      toast({
        title: "Exporting data...",
        description: `Preparing ${format.toUpperCase()} file with current filters.`,
      });

      const tickets = await fetchTicketsForExport(filters);
      
      if (tickets.length === 0) {
        toast({
          title: "No data to export",
          description: "No tickets found with the current filter criteria.",
          variant: "destructive",
        });
        return;
      }

      const formattedData = tickets.map(formatTicketForExport);
      const filename = generateExportFilename(filters);

      if (format === 'csv') {
        exportToCSV(formattedData, filename);
      } else {
        exportToXLSX(formattedData, filename);
      }

      toast({
        title: "Export successful",
        description: `Downloaded ${tickets.length} tickets as ${filename}.${format}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Dynamic spacing based on compact mode
  const cardPadding = compactMode ? 'p-4' : 'p-6';
  const spacing = compactMode ? 'space-y-4' : 'space-y-6';

  return (
    <div className={`${cardPadding} ${spacing}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`${compactMode ? 'text-2xl' : 'text-3xl'} font-bold`}>Reports & Analytics</h1>
          <p className={`text-muted-foreground ${compactMode ? 'text-sm' : ''}`}>
            Comprehensive insights into ticket management and team performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              disabled={isExporting || isLoading}
              size="sm"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('xlsx')}
              disabled={isExporting || isLoading}
              size="sm"
            >
              <Download className="w-4 h-4 mr-1" />
              XLSX
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={compactMode ? 'p-4' : 'p-6'}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Date Range */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange 
                date={filters.dateRange}
                onDateChange={handleDateRangeChange}
              />
            </div>

            {/* Agent Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Agent</label>
              <Select 
                value={filters.agentId || 'all'} 
                onValueChange={(value) => handleFilterChange('agentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select 
                value={filters.categoryId || 'all'} 
                onValueChange={(value) => handleFilterChange('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select 
                value={filters.urgencyId || 'all'} 
                onValueChange={(value) => handleFilterChange('urgencyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className={spacing}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sla">SLA Analysis</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TicketBarChart 
              data={ticketsData} 
              title="Tickets Created vs Closed"
              description="Comparison of ticket creation and closure over time"
            />
            <SLALineChart 
              data={slaData} 
              title="SLA Performance Overview"
              description="SLA compliance trends over the selected period"
            />
          </div>
        </TabsContent>

        {/* SLA Analysis Tab */}
        <TabsContent value="sla" className="space-y-6">
          <SLALineChart 
            data={slaData} 
            title="Detailed SLA Breach Analysis"
            description="Comprehensive view of SLA breaches over time"
            detailed={true}
          />
        </TabsContent>

        {/* Category Analysis Tab */}
        <TabsContent value="categories" className="space-y-6">
          <CategoryHeatmap 
            data={categoryData} 
            title="Issues by Category Heatmap"
            description="Volume of issues per category within the selected period"
          />
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-6">
          <AgentTicketReport 
            data={agentData} 
            title="Agent Performance Report"
            description="Detailed breakdown of tickets handled by each agent/lead by status"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;