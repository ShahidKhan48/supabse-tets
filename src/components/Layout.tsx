import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, User, Ticket, Users, Settings, BarChart3, BookOpen, Shield, Menu, X, LayoutGrid } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, userRole, userName, signOut } = useAuth();
  const { compactMode, toggleCompactMode } = useViewMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const getNavItems = () => {
    const baseItems = [
      { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
      { to: "/tickets", icon: Ticket, label: "Tickets" },
      { to: "/knowledge-base", icon: BookOpen, label: "Knowledge Base" },
    ];

    if (userRole === 'lead' || userRole === 'admin') {
      baseItems.push(
        { to: "/team", icon: Users, label: "Team Management" },
        { to: "/reports", icon: BarChart3, label: "Reports" }
      );
    }


    return baseItems;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mantra
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6">
            {getNavItems().map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right side - View mode toggle, mobile menu, role badge, and user profile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* View Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCompactMode}
              className="hidden sm:flex"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">{compactMode ? 'Normal' : 'Compact'}</span>
            </Button>
            {/* Mobile Menu Toggle */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Mantra
                    </span>
                  </SheetTitle>
                </SheetHeader>
                
                {/* Mobile Navigation Links */}
                <div className="flex flex-col space-y-4 mt-8">
                  {getNavItems().map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors touch-target ${
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>

                
                {/* View Mode Toggle for Mobile */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleCompactMode}
                    className="w-full"
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    View: {compactMode ? 'Compact' : 'Normal'}
                  </Button>
                </div>

                {/* Mobile User Info */}
                <div className="mt-8 p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{userName || user?.email}</p>
                      {userRole && (
                        <Badge variant="secondary" className="capitalize mt-1">
                          {userRole}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={handleSignOut} 
                    variant="destructive" 
                    size="sm" 
                    className="w-full touch-target"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Role Badge - Hidden on small screens to save space */}
            {userRole && (
              <Badge variant="secondary" className="capitalize hidden sm:inline-flex">
                {userRole}
              </Badge>
            )}
            
            {/* Desktop User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden lg:flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-[120px] truncate">{userName || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>User Profile</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2">
                  <div className="text-sm">
                    <strong>Name:</strong> {userName || 'Not set'}
                  </div>
                  <div className="text-sm">
                    <strong>Email:</strong> {user?.email}
                  </div>
                  <div className="text-sm">
                    <strong>Role:</strong> {userRole || 'Not assigned'}
                  </div>
                  <div className="text-sm">
                    <strong>Status:</strong> {user?.email_confirmed_at ? 'Verified' : 'Pending verification'}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile User Avatar - Shows only on small screens */}
            <Button variant="ghost" size="sm" className="lg:hidden" asChild>
              <NavLink to="/profile">
                <User className="w-5 h-5" />
                <span className="sr-only">User profile</span>
              </NavLink>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};