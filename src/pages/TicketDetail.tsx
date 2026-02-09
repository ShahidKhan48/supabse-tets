import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { formatInIST, formatTicketDateTime } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, User, Calendar, Tag, AlertTriangle, MessageSquare, History, Paperclip, Download, FileText, LayoutGrid, Menu } from 'lucide-react';
import { StatusChangeDialog } from '@/components/StatusChangeDialog';
import { L3EscalationDialog } from '@/components/L3EscalationDialog';
import { ReassignDialog } from '@/components/ReassignDialog';

interface TicketDetail {
  id: string;
  display_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  sla_deadline: string | null;
  is_l3: boolean;
  created_by: string;
  assigned_to: string | null;
  category_id: number;
  urgency_id: number;
  creator_name: string;
  assignee_name: string | null;
  category_name: string;
  urgency_label: string;
  urgency_sla_hours: number;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  comment_by: string;
  commenter_name: string;
}

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  changed_by: string;
  changer_name: string;
  meta: any;
}

interface User {
  id: string;
  name: string;
  role_name: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  uploaded_at: string;
  uploaded_by: string;
  uploaded_context: 'creation' | 'update';
  uploader?: { name: string };
}

interface TimelineItem {
  id: string;
  type: 'comment' | 'audit' | 'attachment';
  timestamp: string;
  user_name: string;
  content: string;
  action?: string;
  meta?: any;
  attachment?: Attachment;
}

const TicketDetail: React.FC = () => {
  console.log('TicketDetail component loaded - FileUpload removed');
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { compactMode, toggleCompactMode } = useViewMode();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [l3DialogOpen, setL3DialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingL3, setIsUpdatingL3] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicketData();
      fetchComments();
      fetchAuditLogs();
      fetchUsers();
      fetchAttachments();
    }
  }, [ticketId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!ticketId) return;

    // Subscribe to comments
    const commentsSubscription = supabase
      .channel('ticket-comments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    // Subscribe to audit logs
    const auditSubscription = supabase
      .channel('ticket-audit')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ticket_audit_log', filter: `ticket_id=eq.${ticketId}` },
        () => {
          fetchAuditLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsSubscription);
      supabase.removeChannel(auditSubscription);
    };
  }, [ticketId]);

  useEffect(() => {
    if (ticket?.sla_deadline) {
      const updateTimer = () => {
        // If ticket is resolved or closed, show completion status instead of countdown
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
          const resolvedAt = ticket.resolved_at || new Date().toISOString();
          const deadlineStr = ticket.sla_deadline!.includes('Z') ? ticket.sla_deadline! : ticket.sla_deadline! + 'Z';
          const deadline = new Date(deadlineStr);
          const resolvedDate = new Date(resolvedAt);
          
          if (resolvedDate <= deadline) {
            setTimeLeft('RESOLVED ON TIME');
          } else {
            setTimeLeft('RESOLVED LATE');
          }
          return;
        }
        
        const now = new Date();
        // Ensure the deadline timestamp is treated as UTC
        const deadlineStr = ticket.sla_deadline!.includes('Z') ? ticket.sla_deadline! : ticket.sla_deadline! + 'Z';
        const deadline = new Date(deadlineStr);
        const diff = deadline.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('OVERDUE');
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}m`);
          } else {
            setTimeLeft(`${minutes}m`);
          }
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [ticket?.sla_deadline]);

  const fetchTicketData = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          creator:users!tickets_created_by_fkey(name),
          assignee:users!tickets_assigned_to_fkey(name),
          categories(name),
          urgency_levels(label, sla_hours)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;

      setTicket({
        ...data,
        display_id: data.display_id || data.id,
        creator_name: data.creator?.name || 'Unknown',
        assignee_name: data.assignee?.name || null,
        category_name: data.categories?.name || 'Unknown',
        urgency_label: data.urgency_levels?.label || 'Unknown',
        urgency_sla_hours: data.urgency_levels?.sla_hours || 0,
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          commenter:users!ticket_comments_comment_by_fkey(name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedComments: Comment[] = data.map(comment => ({
        ...comment,
        commenter_name: comment.commenter?.name || 'Unknown'
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_audit_log')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Fetch user names separately
      const userIds = [...new Set(data.map(log => log.changed_by).filter(Boolean))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds);

      const userMap = new Map(usersData?.map(user => [user.id, user.name]) || []);

      const formattedLogs: AuditLog[] = data.map(log => ({
        ...log,
        changer_name: userMap.get(log.changed_by) || 'System'
      }));

      setAuditLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          roles(name)
        `)
        .in('roles.name', ['agent', 'lead', 'admin']);

      if (error) throw error;

      const formattedUsers: User[] = data.map(user => ({
        ...user,
        role_name: user.roles?.name || 'unknown'
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      console.log('Fetching attachments for ticket:', ticketId);
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched attachments:', data);
      
      // Fetch uploader names separately
      const uploaderIds = [...new Set(data?.map(att => att.uploaded_by).filter(Boolean) || [])];
      const { data: uploadersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', uploaderIds);

      const uploaderMap = new Map(uploadersData?.map(user => [user.id, user.name]) || []);
      
      const attachmentsWithUploaders = (data || []).map(attachment => ({
        ...attachment,
        uploaded_context: (attachment.uploaded_context || 'creation') as 'creation' | 'update',
        uploader: { name: uploaderMap.get(attachment.uploaded_by) || 'Unknown' }
      }));
      
      console.log('Attachments with uploaders:', attachmentsWithUploaders);
      setAttachments(attachmentsWithUploaders);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attachments",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (newStatus: string, comment: string) => {
    if (!ticket || !user) return;

    setIsUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id);

      if (error) throw error;

      // Add comment
      const { error: commentError } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          comment: comment,
          comment_by: user.id
        });

      if (commentError) throw commentError;

      // Add audit log
      await supabase
        .from('ticket_audit_log')
        .insert({
          ticket_id: ticket.id,
          action: 'status_changed',
          changed_by: user.id,
          meta: { old_status: ticket.status, new_status: newStatus }
        });

      setTicket({ ...ticket, status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null });
      fetchComments();
      fetchAuditLogs();
      setStatusDialogOpen(false);

      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReassign = async (newUserId: string | null, comment: string) => {
    if (!ticket || !user) return;

    try {
      // Add the comment first
      const { error: commentError } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          comment: comment,
          comment_by: user.id
        });

      if (commentError) throw commentError;

      // Then reassign the ticket
      const { error } = await supabase.rpc('reassign_ticket', {
        ticket: ticket.id,
        new_user: newUserId,
        changed_by: user.id
      });

      if (error) throw error;

      const newAssignee = users.find(u => u.id === newUserId);
      setTicket({ ...ticket, assigned_to: newUserId, assignee_name: newAssignee?.name || null });
      fetchComments();
      fetchAuditLogs();

      toast({
        title: "Ticket Reassigned",
        description: newUserId ? `Assigned to ${newAssignee?.name}` : "Ticket unassigned",
      });
    } catch (error) {
      console.error('Error reassigning ticket:', error);
      toast({
        title: "Error",
        description: "Failed to reassign ticket",
        variant: "destructive",
      });
    }
  };

  const handleL3Toggle = async (comment: string) => {
    if (!ticket || !user) return;

    setIsUpdatingL3(true);
    try {
      const newL3Status = !ticket.is_l3;
      
      const { error } = await supabase
        .from('tickets')
        .update({ is_l3: newL3Status })
        .eq('id', ticket.id);

      if (error) throw error;

      // Add comment
      const { error: commentError } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          comment: comment,
          comment_by: user.id
        });

      if (commentError) throw commentError;

      await supabase
        .from('ticket_audit_log')
        .insert({
          ticket_id: ticket.id,
          action: newL3Status ? 'marked_l3' : 'unmarked_l3',
          changed_by: user.id,
          meta: { is_l3: newL3Status }
        });

      setTicket({ ...ticket, is_l3: newL3Status });
      fetchComments();
      fetchAuditLogs();
      setL3DialogOpen(false);

      toast({
        title: newL3Status ? "Marked as L3" : "Unmarked as L3",
        description: newL3Status ? "Ticket escalated to L3 support" : "Ticket de-escalated from L3",
      });
    } catch (error) {
      console.error('Error updating L3 status:', error);
      toast({
        title: "Error",
        description: "Failed to update L3 status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingL3(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket || !user) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          comment: newComment.trim(),
          comment_by: user.id
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();

      toast({
        title: "Comment Added",
        description: "Your comment has been added to the ticket",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };


  const handleDownloadFile = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'in-progress': return 'default';
      case 'resolved': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityInfo = (urgencyLabel: string, slaHours: number) => {
    if (slaHours <= 4) return { label: 'P1', variant: 'destructive' as const };
    if (slaHours <= 24) return { label: 'P2', variant: 'default' as const };
    return { label: 'P3', variant: 'secondary' as const };
  };

  const combineTimeline = (): TimelineItem[] => {
    const timeline: TimelineItem[] = [];
    const processedCommentIds = new Set<string>();

    // Process audit logs and look for related comments
    auditLogs.forEach(log => {
      console.log('Processing audit log timestamp:', log.timestamp);
      if (!log.timestamp) {
        console.warn('Skipping audit log with invalid timestamp:', log);
        return;
      }
      const logTime = new Date(log.timestamp);
      
      // Look for comment within 2 minutes of the audit action (broader window)
      const relatedComment = comments.find(comment => {
        if (processedCommentIds.has(comment.id)) return false;
        
        const commentTime = new Date(comment.created_at);
        const timeDiff = Math.abs(commentTime.getTime() - logTime.getTime());
        // Allow up to 2 minutes difference and check if same user made both actions
        return timeDiff <= 120000 && 
               log.changed_by === comment.comment_by &&
               (log.action === 'status_changed' || log.action === 'reassigned' || log.action === 'marked_l3' || log.action === 'unmarked_l3');
      });
      
      if (relatedComment) {
        // Combine audit action + comment
        timeline.push({
          id: `${log.id}-combined`,
          type: 'audit',
          timestamp: log.timestamp,
          user_name: log.changer_name,
          content: `${getAuditLogMessage(log)} with comment: "${relatedComment.comment}"`,
          action: log.action,
          meta: log.meta
        });
        
        // Mark comment as processed to avoid duplicate
        processedCommentIds.add(relatedComment.id);
      } else {
        // Regular audit log entry
        timeline.push({
          id: log.id,
          type: 'audit',
          timestamp: log.timestamp,
          user_name: log.changer_name,
          content: getAuditLogMessage(log),
          action: log.action,
          meta: log.meta
        });
      }
    });

    // Add remaining comments that weren't combined
    comments.forEach(comment => {
      if (!processedCommentIds.has(comment.id)) {
        timeline.push({
          id: comment.id,
          type: 'comment',
          timestamp: comment.created_at,
          user_name: comment.commenter_name,
          content: comment.comment
        });
      }
    });

      // Note: Attachments are not included in the activity timeline as per user request

    // Sort by timestamp (newest first) - filter out any items with invalid dates
    return timeline
      .filter(item => {
        if (!item.timestamp) return false;
        const date = new Date(item.timestamp);
        return !isNaN(date.getTime());
      })
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const getAuditLogMessage = (log: AuditLog): string => {
    switch (log.action) {
      case 'status_changed':
        return `Changed status from "${log.meta?.old_status}" to "${log.meta?.new_status}"`;
      case 'reassigned':
        const newAssignee = users.find(u => u.id === log.meta?.new_assignee);
        return log.meta?.new_assignee 
          ? `Assigned ticket to ${newAssignee?.name || 'Unknown'}`
          : 'Unassigned ticket';
      case 'marked_l3':
        return 'Marked as L3 escalation';
      case 'unmarked_l3':
        return 'Removed L3 escalation';
      default:
        return `Performed action: ${log.action}`;
    }
  };

  const canUpdateStatus = () => {
    if (!userRole) return false;
    if (userRole === 'admin' || userRole === 'lead') return true;
    return ticket?.assigned_to === user?.id || ticket?.created_by === user?.id;
  };

  const canReassign = () => {
    return !!user && !!userRole;
  };

  const canMarkL3 = () => {
    return !!user && !!userRole;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Ticket Not Found</h1>
          <p className="text-muted-foreground">The requested ticket could not be found.</p>
        </div>
      </div>
    );
  }

  const timeline = combineTimeline();
  const priorityInfo = getPriorityInfo(ticket.urgency_label, ticket.urgency_sla_hours);

  // Dynamic spacing based on compact mode
  const spacing = compactMode ? 'space-y-3' : 'space-y-6';
  const gridGap = compactMode ? 'gap-3' : 'gap-6';
  const cardPadding = compactMode ? 'p-3' : 'p-6';
  const headerSpacing = compactMode ? 'mb-3' : 'mb-6';
  const timelineSpacing = compactMode ? 'space-y-2' : 'space-y-4';

  return (
    <div className={`${cardPadding} max-w-7xl mx-auto`}>
      {/* Header */}
      <div className={`space-y-4 ${headerSpacing}`}>
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCompactMode}
          >
            {compactMode ? <Menu className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
            <span className="hidden sm:inline">{compactMode ? 'Normal' : 'Compact'}</span>
          </Button>
        </div>

        {/* Ticket Header */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">{ticket.display_id}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusBadgeVariant(ticket.status)}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge variant={priorityInfo.variant}>
                {priorityInfo.label}
              </Badge>
              {ticket.is_l3 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  L3
                </Badge>
              )}
            </div>
          </div>
          <h2 className="text-lg sm:text-xl text-muted-foreground">{ticket.title}</h2>
          
          {/* SLA Information */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>SLA: {ticket.sla_deadline ? formatInIST(ticket.sla_deadline, 'MMM d, yyyy h:mm a \'IST\'') : 'Not set'}</span>
            </div>
            <div className={`text-sm font-medium ${
              timeLeft === 'OVERDUE' || timeLeft === 'RESOLVED LATE' ? 'text-destructive' : 
              timeLeft === 'RESOLVED ON TIME' ? 'text-green-600' : 'text-primary'
            }`}>
              {timeLeft === 'OVERDUE' ? 'OVERDUE' : 
               timeLeft === 'RESOLVED ON TIME' ? 'RESOLVED ON TIME' :
               timeLeft === 'RESOLVED LATE' ? 'RESOLVED LATE' :
               `Time left: ${timeLeft}`}
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 xl:grid-cols-3 ${gridGap}`}>
        {/* Main Content */}
        <div className={`xl:col-span-2 ${spacing}`}>
          {/* Description */}
          <Card>
            <CardHeader className={compactMode ? 'p-3 pb-0' : ''}>
              <CardTitle className={compactMode ? 'text-base' : ''}>Description</CardTitle>
            </CardHeader>
            <CardContent className={compactMode ? 'p-3 pt-2' : ''}>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Attachments */}
          {attachments.length > 0 && (
            <Card>
              <CardHeader className={compactMode ? 'p-3 pb-0' : ''}>
                <CardTitle className={`flex items-center gap-2 ${compactMode ? 'text-base' : ''}`}>
                  <Paperclip className={compactMode ? 'h-4 w-4' : 'h-5 w-5'} />
                  Attachments ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className={compactMode ? 'p-3 pt-2' : ''}>
                <div className={compactMode ? 'space-y-2' : 'space-y-3'}>
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className={`flex items-center justify-between border rounded-lg ${compactMode ? 'p-2' : 'p-3'}`}>
                      <div className="flex items-center gap-3">
                        <FileText className={`text-muted-foreground ${compactMode ? 'h-6 w-6' : 'h-8 w-8'}`} />
                        <div>
                          <p className={`font-medium ${compactMode ? 'text-sm' : ''}`}>{attachment.file_name}</p>
                          <p className={`text-muted-foreground ${compactMode ? 'text-xs' : 'text-sm'}`}>
                            {formatFileSize(attachment.file_size)} • 
                            Uploaded by {attachment.uploader?.name || 'Unknown'} • 
                            {formatTicketDateTime(attachment.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size={compactMode ? 'sm' : 'sm'}
                        onClick={() => handleDownloadFile(attachment)}
                        className={`flex items-center gap-1 ${compactMode ? 'h-7 px-2' : ''}`}
                      >
                        <Download className="h-4 w-4" />
                        {!compactMode && 'Download'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader className={compactMode ? 'p-3 pb-0' : ''}>
              <CardTitle className={`flex items-center gap-2 ${compactMode ? 'text-base' : ''}`}>
                <MessageSquare className={compactMode ? 'h-4 w-4' : 'h-5 w-5'} />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className={compactMode ? 'p-3 pt-2' : ''}>
              {timeline.length === 0 ? (
                <p className={`text-muted-foreground text-center ${compactMode ? 'py-4' : 'py-8'}`}>No activity yet</p>
              ) : (
                <div className={timelineSpacing}>
                   {timeline.map((item) => (
                     <div key={item.id} className={`flex gap-3 border-b last:border-b-0 ${compactMode ? 'pb-2' : 'pb-4'}`}>
                       <div className={`rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}>
                         {item.type === 'comment' ? (
                           <MessageSquare className={`text-primary ${compactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          ) : item.type === 'attachment' ? (
                            <Paperclip className={`text-accent-foreground ${compactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          ) : (
                           <History className={`text-muted-foreground ${compactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                         )}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className={`flex items-center gap-2 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                           <span className="font-medium">{item.user_name}</span>
                           <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {formatTicketDateTime(item.timestamp)}
                            </span>
                         </div>
                         
                          {item.type === 'attachment' && item.attachment ? (
                            <div className={`bg-accent/50 border border-accent rounded-md ${compactMode ? 'mt-1 p-2' : 'mt-2 p-3'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Paperclip className={`text-accent-foreground ${compactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                                  <span className={`font-medium ${compactMode ? 'text-xs' : 'text-sm'}`}>{item.attachment.file_name}</span>
                                  <span className={`text-muted-foreground ${compactMode ? 'text-xs' : 'text-xs'}`}>
                                    ({formatFileSize(item.attachment.file_size)})
                                  </span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadFile(item.attachment!)}
                                  className={compactMode ? 'h-6 px-1' : 'h-7 px-2'}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : item.type === 'comment' ? (
                           <div className={`bg-muted/50 rounded-md ${compactMode ? 'mt-1 p-2' : 'mt-2 p-3'}`}>
                             <p className={compactMode ? 'text-xs' : 'text-sm'}>{item.content}</p>
                           </div>
                         ) : (
                           <p className={`text-muted-foreground ${compactMode ? 'mt-1 text-xs' : 'mt-1 text-sm'}`}>{item.content}</p>
                         )}
                       </div>
                     </div>
                   ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Comment */}
          <Card>
            <CardHeader className={compactMode ? 'p-3 pb-0' : ''}>
              <CardTitle className={compactMode ? 'text-base' : ''}>Add Comment</CardTitle>
            </CardHeader>
            <CardContent className={compactMode ? 'p-3 pt-2' : ''}>
              <div className={compactMode ? 'space-y-2' : 'space-y-4'}>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your comment here..."
                  className={compactMode ? 'min-h-[80px]' : 'min-h-[100px]'}
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  size={compactMode ? 'sm' : 'default'}
                >
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={spacing}>
          {/* Ticket Details */}
          <Card>
            <CardHeader className={compactMode ? 'p-3 pb-0' : ''}>
              <CardTitle className={compactMode ? 'text-base' : ''}>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className={`${compactMode ? 'p-3 pt-2 space-y-2' : 'space-y-4'}`}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className={compactMode ? 'text-xs' : 'text-sm'}>
                  <div className="font-medium">Created by</div>
                  <div className="text-muted-foreground">{ticket.creator_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className={compactMode ? 'text-xs' : 'text-sm'}>
                  <div className="font-medium">Assigned to</div>
                  <div className="text-muted-foreground">{ticket.assignee_name || 'Unassigned'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className={compactMode ? 'text-xs' : 'text-sm'}>
                  <div className="font-medium">Category</div>
                  <div className="text-muted-foreground">{ticket.category_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className={compactMode ? 'text-xs' : 'text-sm'}>
                  <div className="font-medium">Created</div>
                   <div className="text-muted-foreground">
                     {formatTicketDateTime(ticket.created_at)}
                   </div>
                </div>
              </div>

              {ticket.resolved_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className={compactMode ? 'text-xs' : 'text-sm'}>
                    <div className="font-medium">Resolved</div>
                     <div className="text-muted-foreground">
                       {formatTicketDateTime(ticket.resolved_at)}
                     </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className={compactMode ? 'p-3 pb-0' : ''}>
              <CardTitle className={compactMode ? 'text-base' : ''}>Actions</CardTitle>
            </CardHeader>
            <CardContent className={compactMode ? 'p-3 pt-2' : ''}>
              <div className={compactMode ? 'space-y-2' : 'space-y-3'}>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setStatusDialogOpen(true)}
                  disabled={!canUpdateStatus()}
                  size={compactMode ? 'sm' : 'default'}
                >
                  Update Status
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setReassignDialogOpen(true)}
                  disabled={!canReassign()}
                  size={compactMode ? 'sm' : 'default'}
                >
                  Reassign Ticket
                </Button>

                <Button
                  variant={ticket.is_l3 ? "default" : "destructive"}
                  className="w-full justify-start"
                  onClick={() => setL3DialogOpen(true)}
                  disabled={!canMarkL3()}
                  size={compactMode ? 'sm' : 'default'}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {ticket.is_l3 ? 'Remove L3 Escalation' : 'Mark as L3'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <StatusChangeDialog
        isOpen={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleStatusUpdate}
        currentStatus={ticket?.status || ''}
        loading={isUpdatingStatus}
      />

      <L3EscalationDialog
        isOpen={l3DialogOpen}
        onClose={() => setL3DialogOpen(false)}
        onConfirm={handleL3Toggle}
        isCurrentlyL3={ticket?.is_l3 || false}
        loading={isUpdatingL3}
      />

      <ReassignDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        onReassign={handleReassign}
        users={users}
        currentAssignee={ticket?.assigned_to || null}
      />
    </div>
  );
};

export default TicketDetail;