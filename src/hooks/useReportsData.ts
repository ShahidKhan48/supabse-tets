import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters } from '@/pages/Reports';
import { format } from 'date-fns';

interface TicketChartData {
  date: string;
  created: number;
  closed: number;
}

interface SLAChartData {
  date: string;
  breaches: number;
  total: number;
  percentage: number;
}

interface CategoryData {
  category: string;
  count: number;
  intensity: number;
}

interface AgentData {
  agentId: string;
  agentName: string;
  new: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Category {
  id: number;
  name: string;
}

interface UrgencyLevel {
  id: number;
  label: string;
}

export const useReportsData = (filters: ReportFilters) => {
  const [ticketsData, setTicketsData] = useState<TicketChartData[]>([]);
  const [slaData, setSlaData] = useState<SLAChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<UrgencyLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Build date filter
      const dateFilter = filters.dateRange 
        ? `created_at.gte.${format(filters.dateRange.from!, 'yyyy-MM-dd')}${filters.dateRange.to ? `&created_at.lte.${format(filters.dateRange.to, 'yyyy-MM-dd')}` : ''}`
        : '';

      // Fetch tickets data with filters
      let ticketsQuery = supabase
        .from('tickets')
        .select(`
          *,
          categories(name),
          urgency_levels(label),
          created_by_user:users!tickets_created_by_fkey(name),
          assigned_to_user:users!tickets_assigned_to_fkey(name)
        `);

      if (dateFilter) {
        if (filters.dateRange?.from) {
          ticketsQuery = ticketsQuery.gte('created_at', format(filters.dateRange.from, 'yyyy-MM-dd'));
        }
        if (filters.dateRange?.to) {
          ticketsQuery = ticketsQuery.lte('created_at', format(filters.dateRange.to, 'yyyy-MM-dd'));
        }
      }

      if (filters.agentId) {
        ticketsQuery = ticketsQuery.or(`created_by.eq.${filters.agentId},assigned_to.eq.${filters.agentId}`);
      }
      if (filters.categoryId) {
        ticketsQuery = ticketsQuery.eq('category_id', parseInt(filters.categoryId));
      }
      if (filters.urgencyId) {
        ticketsQuery = ticketsQuery.eq('urgency_id', parseInt(filters.urgencyId));
      }

      const { data: tickets } = await ticketsQuery;

      // Fetch reference data
      const [
        { data: usersData },
        { data: categoriesData },
        { data: urgencyLevelsData }
      ] = await Promise.all([
        supabase.from('users').select('id, name, email'),
        supabase.from('categories').select('id, name'),
        supabase.from('urgency_levels').select('id, label')
      ]);

      setUsers(usersData || []);
      setCategories(categoriesData || []);
      setUrgencyLevels(urgencyLevelsData || []);

      if (tickets) {
        // Process tickets data for charts
        processTicketsData(tickets);
        processSLAData(tickets);
        processCategoryData(tickets);
        processAgentData(tickets);
      }

    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processTicketsData = (tickets: any[]) => {
    // Group tickets by date for created vs closed chart
    const dateMap = new Map();
    
    tickets.forEach(ticket => {
      const createDate = format(new Date(ticket.created_at), 'yyyy-MM-dd');
      
      // Count created tickets
      if (!dateMap.has(createDate)) {
        dateMap.set(createDate, { created: 0, closed: 0 });
      }
      dateMap.get(createDate).created++;
      
      // Count closed tickets (based on when they were closed)
      if (ticket.status === 'closed' && ticket.resolved_at) {
        const closedDate = format(new Date(ticket.resolved_at), 'yyyy-MM-dd');
        if (!dateMap.has(closedDate)) {
          dateMap.set(closedDate, { created: 0, closed: 0 });
        }
        dateMap.get(closedDate).closed++;
      }
    });

    const chartData = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        created: data.created,
        closed: data.closed
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setTicketsData(chartData);
  };

  const processSLAData = (tickets: any[]) => {
    // Group tickets by date for SLA breach analysis
    const dateMap = new Map();
    
    tickets.forEach(ticket => {
      const createDate = format(new Date(ticket.created_at), 'yyyy-MM-dd');
      
      if (!dateMap.has(createDate)) {
        dateMap.set(createDate, { total: 0, breaches: 0 });
      }
      
      dateMap.get(createDate).total++;
      
      // Check if SLA was breached
      if (ticket.sla_deadline && ticket.resolved_at) {
        const slaDeadline = new Date(ticket.sla_deadline);
        const resolvedAt = new Date(ticket.resolved_at);
        if (resolvedAt > slaDeadline) {
          dateMap.get(createDate).breaches++;
        }
      } else if (ticket.sla_deadline && !ticket.resolved_at) {
        // Check if current time exceeds SLA
        const slaDeadline = new Date(ticket.sla_deadline);
        if (new Date() > slaDeadline) {
          dateMap.get(createDate).breaches++;
        }
      }
    });

    const slaChartData = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        breaches: data.breaches,
        total: data.total,
        percentage: data.total > 0 ? (data.breaches / data.total) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setSlaData(slaChartData);
  };

  const processCategoryData = (tickets: any[]) => {
    const categoryMap = new Map();
    
    tickets.forEach(ticket => {
      const categoryName = ticket.categories?.name || 'Uncategorized';
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
    });

    const maxCount = Math.max(...Array.from(categoryMap.values()));
    
    const categoryChartData = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      intensity: maxCount > 0 ? (count / maxCount) * 100 : 0
    }));

    setCategoryData(categoryChartData);
  };

  const processAgentData = (tickets: any[]) => {
    const agentMap = new Map();
    
    tickets.forEach(ticket => {
      // Count for creator
      if (ticket.created_by_user) {
        const agentId = ticket.created_by;
        const agentName = ticket.created_by_user.name;
        
        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, {
            agentId,
            agentName,
            new: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0,
            total: 0
          });
        }
      }
      
      // Count for assignee
      if (ticket.assigned_to_user) {
        const agentId = ticket.assigned_to;
        const agentName = ticket.assigned_to_user.name;
        
        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, {
            agentId,
            agentName,
            new: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0,
            total: 0
          });
        }
        
        const agentData = agentMap.get(agentId);
        agentData.total++;
        
        switch (ticket.status) {
          case 'new':
            agentData.new++;
            break;
          case 'in_progress':
            agentData.inProgress++;
            break;
          case 'resolved':
            agentData.resolved++;
            break;
          case 'closed':
            agentData.closed++;
            break;
        }
      }
    });

    setAgentData(Array.from(agentMap.values()));
  };

  const refetch = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  return {
    ticketsData,
    slaData,
    categoryData,
    agentData,
    users,
    categories,
    urgencyLevels,
    isLoading,
    refetch
  };
};