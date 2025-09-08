// frontend/lib/auth.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authAPI } from './api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state
useEffect(() => {
  let isMounted = true;

  const initAuth = async () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));

      // Verify only if we haven't checked recently
      const lastVerified = localStorage.getItem('lastVerified');
      const now = Date.now();

      if (!lastVerified || now - parseInt(lastVerified, 10) > 5 * 60 * 1000) { // 5 min
        try {
          const response = await authAPI.getProfile();
          if (isMounted) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('lastVerified', now.toString());
          }
        } catch (verifyError) {
          console.error('Token verification failed:', verifyError);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('lastVerified');
          setToken(null);
          setUser(null);
        }
      }
    }
    setLoading(false);
  };

  initAuth();
  return () => { isMounted = false; };
}, []);

  // Handle route protection
  useEffect(() => {
    if (!loading) {
      const isAuthRoute = ['/login', '/register'].includes(pathname);
      const isDashboardRoute = pathname.startsWith('/dashboard');
      
      if (!user && isDashboardRoute) {
        router.push('/login');
      } else if (user && isAuthRoute) {
        router.push('/dashboard');
      }
    }
  }, [loading, user, pathname, router]);

  const login = async (credentials) => {
  try {
    const response = await authAPI.login(credentials);
    const { user, token } = response.data;

    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    toast.success('Login successful!');
    return { success: true };
  } catch (error) {
    let message = 'Login failed';
    if (error.response) {
      if (error.response.data?.error) {
        message = error.response.data.error;
      } else if (error.response.data?.details) {
        // Handle validation errors specifically
        message = error.response.data.details.map(d => d.msg).join(', ');
      }
    }
    return { success: false, error: message };
  }
};

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data;

      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.user;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (data) => {
    try {
      await authAPI.changePassword(data);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';
  const isIncharge = user?.role === 'incharge';
  const isFaculty = user?.role === 'faculty';
  const canManageUsers = isAdmin;
  const canApproveResearch = isIncharge;
  const canViewAllResearch = isAdmin;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isIncharge,
    isFaculty,
    canManageUsers,
    canApproveResearch,
    canViewAllResearch,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};