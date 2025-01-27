import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// Log environment variables at load time
console.log('Auth URL from env:', import.meta.env.VITE_AUTH_URL);
const AUTH_URL = import.meta.env.VITE_AUTH_URL || '/auth';
console.log('Final AUTH_URL:', AUTH_URL);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with URL:', `${AUTH_URL}/login`);
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      setUser(data);
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      console.log('Attempting registration with URL:', `${AUTH_URL}/register`);
      const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await response.json();
      setUser(data);
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  // Add useEffect to check environment on mount
  useEffect(() => {
    console.log('AuthContext mounted with AUTH_URL:', AUTH_URL);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};