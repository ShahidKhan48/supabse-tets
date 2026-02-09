import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { formatTicketDateTime, formatSLATime } from '@/lib/dateUtils';
import { Search, Filter, Clock, User, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

interface Ticket {
  id: string;
  display_id?: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at?: string | null;
  sla_deadline: string | null;
  created_by: string;
  assigned_to: string | null;
  creator_name?: string;
  assignee_name?: string;
  category_name?: string;
  urgency_label?: string;
  urgency_sla_hours?: number;
  is_l3?: boolean;
}


const ViewTickets = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { compactMode } = useViewMode();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [l3Filter, setL3Filter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
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
          created_by,
          assigned_to,
          is_l3,
          creator:users!tickets_created_by_fkey(name),
          assignee:users!tickets_assigned_to_fkey(name),
          categories(name),
          urgency_levels(label, sla_hours)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedTickets = data?.map(ticket => ({
        ...ticket,
        display_id: ticket.display_id || ticket.id,
        creator_name: ticket.creator?.name || 'Unknown',
        assignee_name: ticket.assignee?.name || null,
        category_name: ticket.categories?.name || 'Uncategorized',
        urgency_label: ticket.urgency_levels?.label || 'Normal',
        urgency_sla_hours: ticket.urgency_levels?.sla_hours || 24
      })) || [];

      setTickets(processedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tickets",
        variant: "destructive",
      });
    }
  };


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'in_progress': return 'default';
      case 'resolved': return 'outline';
      case 'closed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityFromSLA = (slaHours: number) => {
    if (slaHours <= 4) return { label: 'P1', variant: 'destructive' as const };
    if (slaHours <= 24) return { label: 'P2', variant: 'default' as const };
    return { label: 'P3', variant: 'secondary' as const };
  };

  const isOverdue = (slaDeadline: string | null, status: string, resolvedAt?: string | null) => {
    if (!slaDeadline) return false;
    
    // If ticket is resolved or closed, check if it was resolved before the SLA deadline
    if (status === 'resolved' || status === 'closed') {
      if (!resolvedAt) return false; // Can't determine if no resolution time
      const deadline = new Date(slaDeadline);
      const resolved = new Date(resolvedAt);
      return resolved > deadline; // Only overdue if resolved after deadline
    }
    
    // For active tickets, check if current time is past deadline
    return new Date(slaDeadline) < new Date();
  };


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTickets();
      setLoading(false);
    };

    loadData();

    // Set up real-time subscription
    const channel = supabase
      .channel('ticket-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || 
                         ticket.title.toLowerCase().includes(searchLower) ||
                         ticket.description.toLowerCase().includes(searchLower) ||
                         (ticket.display_id && ticket.display_id.toLowerCase().includes(searchLower)) ||
                         (ticket.creator_name && ticket.creator_name.toLowerCase().includes(searchLower)) ||
                         (ticket.assignee_name && ticket.assignee_name.toLowerCase().includes(searchLower)) ||
                         (ticket.category_name && ticket.category_name.toLowerCase().includes(searchLower)) ||
                         ticket.status.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    
    const matchesAssigned = assignedFilter === 'all' ||
                           (assignedFilter === 'assigned' && ticket.assigned_to) ||
                           (assignedFilter === 'unassigned' && !ticket.assigned_to) ||
                           (assignedFilter === 'mine' && user?.id && (ticket.assigned_to === user.id || ticket.created_by === user.id));
    
    const matchesL3 = l3Filter === 'all' ||
                     (l3Filter === 'l3' && ticket.is_l3) ||
                     (l3Filter === 'non-l3' && !ticket.is_l3);
    
    return matchesSearch && matchesStatus && matchesAssigned && matchesL3;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, assignedFilter, l3Filter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Dynamic spacing based on compact mode
  const spacing = compactMode ? 'space-y-3' : 'space-y-6';
  const cardPadding = compactMode ? 'p-3' : 'p-6';

  return (
    <div className={cardPadding}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            All Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className={spacing}>
          {/* Filters */}
          <div className={`flex flex-col gap-4 ${compactMode ? 'mb-4' : 'mb-6'}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="mine">My Tickets</SelectItem>
                </SelectContent>
              </Select>
              <Select value={l3Filter} onValueChange={setL3Filter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="L3 Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All L3</SelectItem>
                  <SelectItem value="l3">L3 Escalated</SelectItem>
                  <SelectItem value="non-l3">Non-L3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items per page and Top Pagination on same line */}
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${compactMode ? 'text-xs' : 'text-sm'}`}>
              <span className="text-muted-foreground">Items per page:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          {/* Tickets Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Ticket ID</TableHead>
                  <TableHead className="whitespace-nowrap">Title</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Priority</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">CreatedDT</TableHead>
                  <TableHead className="whitespace-nowrap">Created By</TableHead>
                  <TableHead className="whitespace-nowrap">Assigned To</TableHead>
                  <TableHead className="whitespace-nowrap">SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTickets.map((ticket) => {
                    const priority = getPriorityFromSLA(ticket.urgency_sla_hours || 24);
                    const overdue = isOverdue(ticket.sla_deadline, ticket.status, ticket.resolved_at);
                    
                    return (
                      <TableRow key={ticket.id} className={overdue ? "bg-destructive/5" : ""}>
                        <TableCell className="whitespace-nowrap">
                          <button 
                            className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                          >
                            {ticket.display_id || ticket.id.slice(-8)}
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <button 
                            className="font-medium text-left hover:text-primary underline-offset-4 hover:underline max-w-xs overflow-hidden text-ellipsis"
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                          >
                            {ticket.title}
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge variant={priority.variant}>
                              {priority.label}
                            </Badge>
                            {ticket.is_l3 && (
                              <Badge variant="destructive" className="text-xs">
                                L3
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{ticket.category_name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatTicketDateTime(ticket.created_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{ticket.creator_name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {ticket.assignee_name ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {ticket.assignee_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {ticket.sla_deadline ? (
                            <div className={`text-sm ${overdue ? 'text-destructive font-medium' : ''}`}>
                              {overdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                              {formatSLATime(ticket.sla_deadline)}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredTickets.length)} of {filteredTickets.length} tickets
            {filteredTickets.length !== tickets.length && ` (filtered from ${tickets.length} total)`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewTickets;