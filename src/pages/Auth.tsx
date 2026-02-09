import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail } from "lucide-react";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for password reset session on component mount
  useEffect(() => {
    const checkResetSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check URL hash for reset parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        setMode("reset");
      }
    };
    
    checkResetSession();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if user is enabled immediately after successful authentication
      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('enabled, name')
          .eq('id', authData.user.id)
          .single();

        if (userError || !userData) {
          toast({
            title: "Login Failed",
            description: "Unable to verify user account",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (!userData.enabled) {
          toast({
            title: "Account Disabled",
            description: "Your account is disabled, Contact Admin",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }
      }

      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: formData.name,
          role: formData.role,
        },
      },
    });

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      setMode("login");
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
      setMode("login");
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: formData.password
    });

    if (error) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      setMode("login");
      setFormData({ name: "", email: "", password: "", confirmPassword: "", role: "" });
      
      // Clear URL hash
      window.history.replaceState(null, '', window.location.pathname);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        {/* Paper airplane */}
        <div className="absolute top-20 left-20">
          <svg width="60" height="60" viewBox="0 0 60 60" className="text-blue-500">
            <path d="M8 8l44 20-20 4-4 20L8 8z" fill="currentColor" opacity="0.8"/>
          </svg>
        </div>
        
        {/* Tropical leaves - left side */}
        <div className="absolute bottom-20 left-10">
          <svg width="120" height="120" viewBox="0 0 120 120" className="text-orange-400">
            <ellipse cx="60" cy="60" rx="50" ry="25" fill="currentColor" opacity="0.7" transform="rotate(-30 60 60)"/>
            <ellipse cx="60" cy="60" rx="40" ry="20" fill="currentColor" opacity="0.8" transform="rotate(-45 60 60)"/>
          </svg>
        </div>
        
        {/* Tropical leaves - right side */}
        <div className="absolute bottom-32 right-10">
          <svg width="140" height="140" viewBox="0 0 140 140" className="text-teal-400">
            <ellipse cx="70" cy="70" rx="60" ry="30" fill="currentColor" opacity="0.6" transform="rotate(30 70 70)"/>
            <ellipse cx="70" cy="70" rx="50" ry="25" fill="currentColor" opacity="0.7" transform="rotate(45 70 70)"/>
          </svg>
        </div>
        
        {/* Person with laptop - right side */}
        <div className="absolute top-32 right-20">
          <svg width="100" height="100" viewBox="0 0 100 100" className="text-purple-400">
            <circle cx="50" cy="25" r="15" fill="currentColor" opacity="0.7"/>
            <rect x="35" y="40" width="30" height="40" rx="5" fill="currentColor" opacity="0.6"/>
            <rect x="40" y="50" width="20" height="12" rx="2" fill="currentColor" opacity="0.8"/>
          </svg>
        </div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-card rounded-3xl">
        <CardHeader className="space-y-6 text-center pt-8">
          {/* Logo */}
          <div className="mx-auto mb-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mantra
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-8">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Username or Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email..."
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 py-3 bg-muted border-0 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password..."
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 py-3 bg-muted border-0 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground">Keep me logged in</Label>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <Button type="submit" className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base" disabled={isLoading}>
                {isLoading ? "Signing in..." : "LOGIN"}
              </Button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10 py-3 bg-muted border-0 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="signup-email" className="text-sm font-medium text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 py-3 bg-muted border-0 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="role" className="text-sm font-medium text-muted-foreground">Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger className="py-3 bg-muted border-0 rounded-xl">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="signup-password" className="text-sm font-medium text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 py-3 bg-muted border-0 rounded-xl"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base" disabled={isLoading}>
                {isLoading ? "Creating account..." : "CREATE ACCOUNT"}
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="forgot-email" className="text-sm font-medium text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 py-3 bg-muted border-0 rounded-xl"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base" disabled={isLoading}>
                {isLoading ? "Sending..." : "SEND RESET EMAIL"}
              </Button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center mb-6">
                <CardTitle className="text-xl font-semibold">Reset Your Password</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-2">
                  Enter your new password below
                </CardDescription>
              </div>
              <div className="space-y-3">
                <Label htmlFor="new-password" className="text-sm font-medium text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 py-3 bg-muted border-0 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-muted-foreground">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 py-3 bg-muted border-0 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base" disabled={isLoading}>
                {isLoading ? "Updating..." : "UPDATE PASSWORD"}
              </Button>
            </form>
          )}

          <div className="text-center space-y-2">
            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm text-primary hover:underline"
              >
                Forgot your password?
              </button>
            )}

            {mode === "signup" && (
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            )}

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </button>
            )}

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;