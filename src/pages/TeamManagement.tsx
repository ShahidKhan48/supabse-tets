import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UsersTable } from '@/components/UsersTable';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

interface TeamMemberForm {
  name: string;
  email: string;
  role: string;
  password: string;
}

const TeamManagement: React.FC = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState<TeamMemberForm>({
    name: '',
    email: '',
    role: '',
    password: ''
  });

  // Redirect if not admin
  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-destructive text-lg font-semibold mb-2">Access Denied</div>
        <p className="text-muted-foreground">Only administrators can access team management.</p>
      </div>
    );
  }

  const handleInputChange = (field: keyof TeamMemberForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use the admin-create-user edge function to maintain admin session
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error creating account",
          description: error.message || "Failed to create user account",
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Error creating account",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Account created successfully",
          description: `Team member ${formData.name} has been added to the system.`,
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          role: '',
          password: ''
        });

        // Refresh the users table
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error creating team member:', error);
      toast({
        title: "Error",
        description: "Failed to create team member account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Team Management</h1>
        <p className="text-muted-foreground">Add new team members and manage existing users</p>
      </div>

      {/* Add Team Member Form */}
      <Card className="shadow-lg mb-8">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Add Team Member</h2>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-foreground">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="md:col-span-4 flex justify-center">
              <Button 
                type="submit" 
                className="px-8"
                disabled={isLoading}
              >
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <UsersTable refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;