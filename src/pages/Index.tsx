import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useNavigate } from "react-router-dom";
import { TicketSummary } from "@/components/TicketSummary";

const Index = () => {
  const { userRole } = useAuth();
  const { compactMode } = useViewMode();
  const navigate = useNavigate();

  // Dynamic spacing based on compact mode
  const cardPadding = compactMode ? 'p-4' : 'p-6';
  const gridGap = compactMode ? 'gap-4' : 'gap-6';
  const headerSpacing = compactMode ? 'mb-6' : 'mb-8';

  return (
    <div className={cardPadding}>
      <div className="max-w-4xl mx-auto">
        <div className={`text-center ${headerSpacing}`}>
          <h1 className={`${compactMode ? 'text-3xl' : 'text-4xl'} font-bold ${compactMode ? 'mb-3' : 'mb-4'}`}>Welcome to Mantra Dashboard</h1>
          <p className={`${compactMode ? 'text-lg' : 'text-xl'} text-muted-foreground`}>Your technical support portal is ready!</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>View and manage support requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => navigate('/create-ticket')}
                className="w-full"
              >
                Create New Ticket
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/tickets')}
              >
                View Tickets
              </Button>
              <TicketSummary />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Access help articles and documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Browse support articles.</p>
            </CardContent>
          </Card>

          {(userRole === 'lead' || userRole === 'admin') && (
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage team members and assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">View team performance.</p>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  );
};

export default Index;
