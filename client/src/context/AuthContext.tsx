import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseClientConfigured } from '../api/client';
import { UserRole } from '@shared/types';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  farmCount: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
}

const defaultDemoUser: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo.farmer@agrigenome.io',
  fullName: 'Dr. Sarah Vance',
  role: 'farmer',
  farmCount: 1,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('agri_demo_user');
    return saved ? JSON.parse(saved) : defaultDemoUser;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isSupabaseClientConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Agri User',
            role: session.user.user_metadata?.role || 'farmer',
            farmCount: 1,
          });
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Agri User',
            role: session.user.user_metadata?.role || 'farmer',
            farmCount: 1,
          });
        } else {
          setUser(defaultDemoUser);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password?: string) => {
    if (isSupabaseClientConfigured && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      // Demo authentication
      const demoProfile: UserProfile = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        fullName: email.split('@')[0].replace('.', ' ').toUpperCase(),
        role: 'farmer',
        farmCount: 1,
      };
      setUser(demoProfile);
      localStorage.setItem('agri_demo_user', JSON.stringify(demoProfile));
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    if (isSupabaseClientConfigured) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });
      if (error) throw error;
    } else {
      const newUser: UserProfile = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        fullName,
        role,
        farmCount: 1,
      };
      setUser(newUser);
      localStorage.setItem('agri_demo_user', JSON.stringify(newUser));
    }
  };

  const signOut = async () => {
    if (isSupabaseClientConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('agri_demo_user');
  };

  const switchDemoRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('agri_demo_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
