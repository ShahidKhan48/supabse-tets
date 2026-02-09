import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { User, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface AgentData {
  agentId: string;
  agentName: string;
  new: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

interface AgentTicketReportProps {
  data: AgentData[];
  title?: string;
  description?: string;
}

const STATUS_COLORS = {
  new: 'hsl(var(--destructive))',
  inProgress: 'hsl(var(--warning))',
  resolved: 'hsl(var(--primary))',
  closed: 'hsl(var(--muted-foreground))',
};

export const AgentTicketReport: React.FC<AgentTicketReportProps> = ({ 
  data, 
  title = "Agent Performance Report",
  description = "Detailed breakdown of tickets handled by each agent/lead by status"
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const getResolutionRate = (agent: AgentData) => {
    return agent.total > 0 ? (agent.resolved / agent.total) * 100 : 0;
  };

  const getStatusBadgeVariant = (status: string, count: number) => {
    if (count === 0) return 'outline';
    switch (status) {
      case 'resolved': return 'default';
      case 'inProgress': return 'secondary';
      case 'new': return 'destructive';
      default: return 'outline';
    }
  };

  // Prepare data for charts
  const sortedAgents = [...data].sort((a, b) => b.total - a.total);
  const topPerformers = sortedAgents.slice(0, 10);

  const agentChartData = topPerformers.map(agent => ({
    name: agent.agentName.length > 12 ? agent.agentName.substring(0, 12) + '...' : agent.agentName,
    fullName: agent.agentName,
    new: agent.new,
    inProgress: agent.inProgress,
    resolved: agent.resolved,
    closed: agent.closed,
    total: agent.total,
    resolutionRate: getResolutionRate(agent)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.fullName}</p>
          <div className="space-y-1">
            <p className="text-sm text-destructive">New: {data.new}</p>
            <p className="text-sm text-warning">In Progress: {data.inProgress}</p>
            <p className="text-sm text-primary">Resolved: {data.resolved}</p>
            <p className="text-sm text-muted-foreground">Closed: {data.closed}</p>
            <p className="text-sm font-medium">Resolution Rate: {data.resolutionRate.toFixed(1)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const selectedAgentData = selectedAgent ? data.find(a => a.agentId === selectedAgent) : null;
  const pieData = selectedAgentData ? [
    { name: 'New', value: selectedAgentData.new, fill: STATUS_COLORS.new },
    { name: 'In Progress', value: selectedAgentData.inProgress, fill: STATUS_COLORS.inProgress },
    { name: 'Resolved', value: selectedAgentData.resolved, fill: STATUS_COLORS.resolved },
  ].filter(item => item.value > 0) : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            <TabsTrigger value="performance">Performance Chart</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAgents.map((agent, index) => {
                const resolutionRate = getResolutionRate(agent);
                return (
                  <Card 
                    key={agent.agentId} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedAgent(agent.agentId)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <CardTitle className="text-sm font-medium truncate">
                            {agent.agentName}
                          </CardTitle>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">{agent.total}</span>
                          <span className="text-sm text-muted-foreground">Total Tickets</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Resolution Rate</span>
                            <span className="font-medium">{resolutionRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={resolutionRate} className="h-2" />
                        </div>

                        <div className="flex justify-between gap-2">
                          <Badge variant={getStatusBadgeVariant('new', agent.new)} className="text-xs">
                            New: {agent.new}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant('inProgress', agent.inProgress)} className="text-xs">
                            In Progress: {agent.inProgress}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant('resolved', agent.resolved)} className="text-xs">
                            Resolved: {agent.resolved}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Detailed View Tab */}
          <TabsContent value="detailed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedAgents.filter(agent => agent.total > 0).map((agent) => {
                const agentPieData = [
                  { name: 'New', value: agent.new, fill: STATUS_COLORS.new },
                  { name: 'In Progress', value: agent.inProgress, fill: STATUS_COLORS.inProgress },
                  { name: 'Resolved', value: agent.resolved, fill: STATUS_COLORS.resolved },
                  { name: 'Closed', value: agent.closed, fill: STATUS_COLORS.closed },
                ];

                return (
                  <Card key={agent.agentId} className="space-y-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="w-4 h-4" />
                        {agent.agentName}
                      </CardTitle>
                      <CardDescription>
                        {agent.total} tickets | {getResolutionRate(agent).toFixed(1)}% resolved
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pie Chart */}
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={agentPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={70}
                              dataKey="value"
                            >
                              {agentPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any, name: any) => [value, name]}
                              labelFormatter={() => agent.agentName}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Performance Metrics */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span className="text-sm">Resolved</span>
                          </div>
                          <span className="font-medium">{agent.resolved}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-warning" />
                            <span className="text-sm">In Progress</span>
                          </div>
                          <span className="font-medium">{agent.inProgress}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-sm">Resolution Rate</span>
                          </div>
                          <span className="font-medium">{getResolutionRate(agent).toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Status Legend */}
                      <div className="grid grid-cols-2 gap-1 text-xs pt-2 border-t">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: STATUS_COLORS.new}}></div>
                          New: {agent.new}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: STATUS_COLORS.inProgress}}></div>
                          Progress: {agent.inProgress}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: STATUS_COLORS.resolved}}></div>
                          Resolved: {agent.resolved}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: STATUS_COLORS.closed}}></div>
                          Closed: {agent.closed}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Performance Chart Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Overall Performance Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Comparison</CardTitle>
                <CardDescription>Ticket distribution across all agents based on current filters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agentChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="new" name="New" fill={STATUS_COLORS.new} />
                      <Bar dataKey="inProgress" name="In Progress" fill={STATUS_COLORS.inProgress} />
                      <Bar dataKey="resolved" name="Resolved" fill={STATUS_COLORS.resolved} />
                      <Bar dataKey="closed" name="Closed" fill={STATUS_COLORS.closed} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Individual Agent Pie Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Individual Agent Performance</CardTitle>
                <CardDescription>Detailed ticket distribution for each agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedAgents.filter(agent => agent.total > 0).map((agent) => {
                    const agentPieData = [
                      { name: 'New', value: agent.new, fill: STATUS_COLORS.new },
                      { name: 'In Progress', value: agent.inProgress, fill: STATUS_COLORS.inProgress },
                      { name: 'Resolved', value: agent.resolved, fill: STATUS_COLORS.resolved },
                      { name: 'Closed', value: agent.closed, fill: STATUS_COLORS.closed },
                    ];

                    return (
                      <div key={agent.agentId} className="space-y-2">
                        <div className="text-center">
                          <h4 className="font-medium text-sm truncate">{agent.agentName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {agent.total} tickets | {getResolutionRate(agent).toFixed(1)}% resolved
                          </p>
                        </div>
                        <div className="h-[150px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={agentPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={60}
                                dataKey="value"
                              >
                                {agentPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: any, name: any) => [value, name]}
                                labelFormatter={() => agent.agentName}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: STATUS_COLORS.new}}></div>
                            {agent.new}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: STATUS_COLORS.inProgress}}></div>
                            {agent.inProgress}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: STATUS_COLORS.resolved}}></div>
                            {agent.resolved}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: STATUS_COLORS.closed}}></div>
                            {agent.closed}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-xl font-bold text-primary">
              {data.length}
            </div>
            <div className="text-sm text-muted-foreground">Active Agents</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {data.reduce((sum, agent) => sum + agent.total, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary">
              {data.reduce((sum, agent) => sum + agent.resolved, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Resolved</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-secondary">
              {data.length > 0 ? 
                (data.reduce((sum, agent) => sum + getResolutionRate(agent), 0) / data.length).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <div className="text-sm text-muted-foreground">Avg Resolution Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};