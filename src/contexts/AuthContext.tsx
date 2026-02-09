import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  userName: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle additional data fetching if needed
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            // Fetch user role and name from database
            const { data: userData } = await supabase
              .from('users')
              .select(`
                name,
                role_id,
                enabled,
                roles:role_id (
                  name
                )
              `)
              .eq('id', session.user.id)
              .single();
            
            if (userData) {
              // Check if user is enabled
              if (!userData.enabled) {
                console.log('User is disabled, signing out...');
                cleanupAuthState();
                await supabase.auth.signOut({ scope: 'global' });
                window.location.href = '/';
                return;
              }
              
              if (userData.roles) {
                setUserRole(userData.roles.name);
              }
              if (userData.name) {
                setUserName(userData.name);
              }
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setUserName(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch user role if session exists
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select(`
            name,
            role_id,
            enabled,
            roles:role_id (
              name
            )
          `)
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          // Check if user is enabled
          if (!userData.enabled) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setUserRole(null);
            setUserName(null);
            setLoading(false);
            return;
          }
          
          if (userData.roles) {
            setUserRole(userData.roles.name);
          }
          if (userData.name) {
            setUserName(userData.name);
          }
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Utility function to clean up all auth-related localStorage items
  const cleanupAuthState = () => {
    // Clear local state immediately
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserName(null);
    
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const signOut = async () => {
    try {
      // Clean up auth state immediately
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      // Redirect to auth page
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, ensure we're cleaned up and redirected
      cleanupAuthState();

      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    userName,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
