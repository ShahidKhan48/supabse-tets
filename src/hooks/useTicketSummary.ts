import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TicketStatusCount {
  status: string;
  count: number;
}

export const useTicketSummary = () => {
  const [weeklyTicketCounts, setWeeklyTicketCounts] = useState<TicketStatusCount[]>([]);
  const [totalTicketCounts, setTotalTicketCounts] = useState<TicketStatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketSummary = async () => {
      try {
        setLoading(true);
        
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Fetch weekly tickets
        const { data: weeklyData, error: weeklyError } = await supabase
          .from('tickets')
          .select('status')
          .gte('created_at', sevenDaysAgo.toISOString());

        if (weeklyError) throw weeklyError;

        // Fetch all tickets
        const { data: totalData, error: totalError } = await supabase
          .from('tickets')
          .select('status');

        if (totalError) throw totalError;

        // Group weekly tickets by status and count them
        const weeklyStatusCounts: { [key: string]: number } = {};
        weeklyData?.forEach((ticket) => {
          const status = ticket.status || 'unknown';
          weeklyStatusCounts[status] = (weeklyStatusCounts[status] || 0) + 1;
        });

        // Group total tickets by status and count them  
        const totalStatusCounts: { [key: string]: number } = {};
        totalData?.forEach((ticket) => {
          const status = ticket.status || 'unknown';
          totalStatusCounts[status] = (totalStatusCounts[status] || 0) + 1;
        });

        // Convert to array format
        const weeklyCountsArray = Object.entries(weeklyStatusCounts).map(([status, count]) => ({
          status,
          count
        }));

        const totalCountsArray = Object.entries(totalStatusCounts).map(([status, count]) => ({
          status,
          count
        }));

        setWeeklyTicketCounts(weeklyCountsArray);
        setTotalTicketCounts(totalCountsArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ticket summary');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketSummary();
  }, []);

  return { weeklyTicketCounts, totalTicketCounts, loading, error };
};