'use client';

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';
import { User } from '@/types/user';
import { authService } from '@/services/authService';
import { toast } from 'react-hot-toast';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUserFromCookies() {
      const token = Cookies.get('access_token');
      if (token) {
        try {
          const decoded: any = jwt_decode(token);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            await refreshToken();
          } else {
            setUser({
              id: parseInt(decoded.sub),
              email: decoded.email,
              roles: decoded.roles || [],
            });
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
        }
      }
      setLoading(false);
    }

    loadUserFromCookies();
  }, []);

  const refreshToken = async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      Cookies.set('access_token', response.access_token);
      Cookies.set('refresh_token', response.refresh_token);

      const decoded: any = jwt_decode(response.access_token);
      setUser({
        id: parseInt(decoded.sub),
        email: decoded.email,
        roles: decoded.roles || [],
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      setUser(null);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const response = await authService.login(email, password);
      
      const expiresIn = rememberMe ? 7 : 1; // 7 days or 1 day
      Cookies.set('access_token', response.access_token, { expires: expiresIn });
      Cookies.set('refresh_token', response.refresh_token, { expires: expiresIn });
      
      const decoded: any = jwt_decode(response.access_token);
      setUser({
        id: parseInt(decoded.sub),
        email: decoded.email,
        roles: decoded.roles || [],
      });
      
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Failed to login');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      setUser(null);
      router.push('/');
      toast.success('Logged out successfully');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      await authService.register(email, password, name);
      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/login');
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.detail || 'Failed to register');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}