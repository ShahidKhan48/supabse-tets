import * as XLSX from 'xlsx';
import { formatTicketDateTime } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import type { ReportFilters } from '@/pages/Reports';

interface TicketExportData {
  id: string;
  display_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  sla_deadline: string;
  is_l3: boolean;
  creator: { name: string } | null;
  assignee: { name: string } | null;
  categories: { name: string } | null;
  urgency_levels: { label: string; sla_hours: number } | null;
}

export const fetchTicketsForExport = async (filters: ReportFilters): Promise<TicketExportData[]> => {
  let query = supabase
    .from('tickets')
    .select(`
      id,
      display_id,
      title,
      description,
      status,
      created_at,
      resolved_at,
      sla_deadline,
      is_l3,
      creator:users!tickets_created_by_fkey(name),
      assignee:users!tickets_assigned_to_fkey(name),
      categories(name),
      urgency_levels(label, sla_hours)
    `)
    .order('created_at', { ascending: false });

  // Apply date range filter
  if (filters.dateRange?.from) {
    query = query.gte('created_at', filters.dateRange.from.toISOString());
  }
  if (filters.dateRange?.to) {
    const toDate = new Date(filters.dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte('created_at', toDate.toISOString());
  }

  // Apply other filters
  if (filters.agentId) {
    query = query.eq('assigned_to', filters.agentId);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', parseInt(filters.categoryId));
  }
  if (filters.urgencyId) {
    query = query.eq('urgency_id', parseInt(filters.urgencyId));
  }

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }

  return data || [];
};

export const formatTicketForExport = (ticket: TicketExportData) => {
  return {
    'Ticket ID': ticket.display_id,
    'Title': ticket.title,
    'Description': ticket.description,
    'Status': ticket.status.toUpperCase().replace('_', ' '),
    'Priority': ticket.urgency_levels?.label || 'N/A',
    'SLA Hours': ticket.urgency_levels?.sla_hours || 'N/A',
    'Category': ticket.categories?.name || 'N/A',
    'Created By': ticket.creator?.name || 'N/A',
    'Assigned To': ticket.assignee?.name || 'Unassigned',
    'L3 Escalation': ticket.is_l3 ? 'Yes' : 'No',
    'Created Date': formatTicketDateTime(ticket.created_at),
    'SLA Deadline': formatTicketDateTime(ticket.sla_deadline),
    'Resolved Date': ticket.resolved_at ? formatTicketDateTime(ticket.resolved_at) : 'Not Resolved',
    'Resolution Time (Hours)': ticket.resolved_at 
      ? Math.round((new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60))
      : 'N/A'
  };
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToXLSX = (data: any[], filename: string) => {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-fit column widths
  const colWidths = Object.keys(data[0]).map(key => {
    const maxLength = Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

  // Save the file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const generateExportFilename = (filters: ReportFilters): string => {
  const baseFilename = 'tickets_export';
  const timestamp = new Date().toISOString().split('T')[0];
  
  let filterSuffix = '';
  if (filters.dateRange?.from && filters.dateRange?.to) {
    const fromDate = filters.dateRange.from.toISOString().split('T')[0];
    const toDate = filters.dateRange.to.toISOString().split('T')[0];
    filterSuffix += `_${fromDate}_to_${toDate}`;
  }
  
  return `${baseFilename}${filterSuffix}_${timestamp}`;
};