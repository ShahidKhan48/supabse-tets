import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CreateTicket from "./pages/CreateTicket";
import ViewTickets from "./pages/ViewTickets";
import TicketDetail from "./pages/TicketDetail";
import Reports from "./pages/Reports";
import TeamManagement from "./pages/TeamManagement";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Auth />
        } 
      />
      <Route 
        path="/auth" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Auth />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <Index />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tickets" 
        element={
          <ProtectedRoute>
            <Layout>
              <ViewTickets />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tickets/:ticketId" 
        element={
          <ProtectedRoute>
            <Layout>
              <TicketDetail />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-ticket" 
        element={
          <ProtectedRoute>
            <Layout>
              <CreateTicket />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/knowledge-base" 
        element={
          <ProtectedRoute>
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Knowledge Base</h1>
                <p className="text-muted-foreground">Knowledge base coming soon...</p>
              </div>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/team" 
        element={
          <ProtectedRoute>
            <Layout>
              <TeamManagement />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground">Admin panel coming soon...</p>
              </div>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Settings coming soon...</p>
              </div>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewModeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </ViewModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
