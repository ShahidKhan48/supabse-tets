import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EditUserDialog } from './EditUserDialog';
import { Loader2, RefreshCw, Edit } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  status: string;
  created_at: string;
  roles: {
    name: string;
  };
}

interface UsersTableProps {
  refreshTrigger?: number;
}

export const UsersTable: React.FC<UsersTableProps> = ({ refreshTrigger }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { userRole } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          enabled,
          status,
          created_at,
          roles!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    // Only admins can enable disabled users
    if (!currentStatus && userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can enable disabled users",
        variant: "destructive"
      });
      return;
    }

    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ enabled: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, enabled: !currentStatus }
          : user
      ));

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
              {userRole === 'admin' && <TableHead>Edit</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {user.roles.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.enabled ? "default" : "destructive"}>
                    {user.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={user.enabled}
                      onCheckedChange={() => toggleUserStatus(user.id, user.enabled)}
                      disabled={updating === user.id}
                    />
                    <span className="text-sm text-muted-foreground">
                      {updating === user.id ? "Updating..." : user.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </TableCell>
                {userRole === 'admin' && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found
        </div>
      )}

      <EditUserDialog
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};