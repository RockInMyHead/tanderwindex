import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, AuthUser } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapping server error messages to Russian
const ERROR_MESSAGES_RU: Record<string, string> = {
  'Username already exists': 'Имя пользователя уже существует',
  'Email already exists': 'Email уже используется',
  'Validation error': 'Проверьте правильность вводимых данных',
  'Server error': 'Серверная ошибка, попробуйте позже',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData(token);
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          user: userData,
          token,
          isLoading: false,
          error: null,
        });
      } else {
        // Token is invalid or expired
        localStorage.removeItem('token');
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        error: error.message,
      });
    }
  };

  const login = async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      
      setAuthState({
        user: data.user,
        token: data.token,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: 'Успешный вход',
        description: 'Вы успешно вошли в систему',
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Ошибка входа',
      }));
      
      toast({
        title: 'Ошибка входа',
        description: error.message || 'Проверьте имя пользователя и пароль',
        variant: 'destructive',
      });
    }
  };

  const register = async (userData: any) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      
      setAuthState({
        user: data.user,
        token: data.token,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: 'Регистрация успешна',
        description: 'Ваш аккаунт успешно создан',
      });
    } catch (err: any) {
      // Extract message from error
      let msg = err.message || 'Ошибка регистрации';
      // If error message is JSON with status code prefix, try to parse
      try {
        const jsonPart = msg.replace(/^\d{3}:?\s*/, '');
        const parsed = JSON.parse(jsonPart);
        if (parsed && parsed.message) msg = parsed.message;
      } catch {}
      // Translate to Russian if known
      const rusMsg = ERROR_MESSAGES_RU[msg] || msg;
      // Update state and toast
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: rusMsg,
      }));
      toast({
        title: 'Ошибка регистрации',
        description: rusMsg,
        variant: 'destructive',
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    
    toast({
      title: 'Выход выполнен',
      description: 'Вы успешно вышли из системы',
    });
  };

  // Send password reset email
  const forgotPassword = async (email: string) => {
    const response = await apiRequest('POST', '/api/auth/forgot-password', { email });
    const data = await response.json();
    return data;
  };

  // Reset password using token
  const resetPassword = async (token: string, newPassword: string) => {
    const response = await apiRequest('POST', '/api/auth/reset-password', { token, password: newPassword });
    const data = await response.json();
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        isAuthenticated: !!authState.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
