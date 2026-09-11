import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ClaimDailyBonusResponse } from '../types.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, pin?: string, pinToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserCredits: (newBalance: number) => void;
  claimDailyBonus: (optionId?: string) => Promise<ClaimDailyBonusResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (!api.getToken()) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await api.getMe();
      setUser(res.user);
    } catch (err: any) {
      // Only clear credentials if the server explicitly confirmed invalid/expired session (HTTP 401)
      // Never sign out on transient network errors, timeouts, or temporary connectivity drops
      if (
        err?.status === 401 || 
        err?.message?.toLowerCase().includes('session expired') || 
        err?.message?.toLowerCase().includes('please log in')
      ) {
        api.setToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Rolling session renewal: proactively renew token every 6 hours while user is active
    const renewalInterval = setInterval(() => {
      if (api.getToken()) {
        api.refreshToken().catch(() => {});
      }
    }, 6 * 60 * 60 * 1000);

    // Re-verify user state upon network reconnection
    const handleOnline = () => {
      if (api.getToken()) {
        refreshUser();
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(renewalInterval);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
  };

  const register = async (email: string, password: string, name: string, pin?: string, pinToken?: string) => {
    const res = await api.register({ email, password, name, pin, pinToken });
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateUserCredits = (newBalance: number) => {
    setUser(prev => prev ? { ...prev, credits: Number(newBalance.toFixed(2)) } : null);
  };

  const claimDailyBonus = async (optionId?: string) => {
    const res = await api.claimDailyBonus(optionId);
    if (res.success && res.newBalance !== undefined) {
      updateUserCredits(res.newBalance);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshUser,
        updateUserCredits,
        claimDailyBonus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
