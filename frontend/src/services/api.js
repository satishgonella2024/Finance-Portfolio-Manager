// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_URL = import.meta.env.VITE_AUTH_URL || '/auth';

// Debug logging for environment variables
console.log('API Config:', { API_URL, AUTH_URL });

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
  console.log('Request headers:', headers);
  return headers;
};

const fetchWithAuth = async (url, options = {}) => {
  const headers = getAuthHeaders();
  console.log('Making authenticated request to:', url, { ...options, headers });
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('Unauthorized access, clearing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.text();
      console.error('Request failed:', error);
      try {
        const errorJson = JSON.parse(error);
        throw new Error(errorJson.error || 'Request failed');
      } catch (e) {
        throw new Error(error || 'Request failed');
      }
    }

    // Try to get the response as text first for debugging
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    try {
      return { json: () => Promise.resolve(JSON.parse(responseText)) };
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const api = {
  // Auth endpoints
  login: async (email, password) => {
    console.log('Attempting login for email:', email);
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Login failed:', error);
      try {
        const errorJson = JSON.parse(error);
        throw new Error(errorJson.error || 'Login failed');
      } catch (e) {
        throw new Error(error || 'Login failed');
      }
    }

    const data = await response.json();
    console.log('Login successful');
    localStorage.setItem('token', data.token);
    return data;
  },

  register: async (email, password) => {
    console.log('Attempting registration for email:', email);
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Registration failed:', error);
      try {
        const errorJson = JSON.parse(error);
        throw new Error(errorJson.error || 'Registration failed');
      } catch (e) {
        throw new Error(error || 'Registration failed');
      }
    }

    const data = await response.json();
    console.log('Registration successful');
    localStorage.setItem('token', data.token);
    return data;
  },

  // Portfolio endpoints
  getPortfolios: async () => {
    console.log('Fetching portfolios');
    const response = await fetchWithAuth(`${API_URL}/portfolio`);
    return response.json();
  },

  createPortfolio: async (name) => {
    console.log('Creating portfolio:', name);
    const response = await fetchWithAuth(`${API_URL}/portfolio`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  addHolding: async (portfolioId, holding) => {
    console.log('Adding holding to portfolio:', portfolioId, holding);
    const response = await fetchWithAuth(`${API_URL}/portfolio/${portfolioId}/holdings`, {
      method: 'POST',
      body: JSON.stringify(holding)
    });
    return response.json();
  },

  deleteHolding: async (portfolioId, holdingId) => {
    console.log('Deleting holding:', portfolioId, holdingId);
    const response = await fetchWithAuth(`${API_URL}/portfolio/${portfolioId}/holdings/${holdingId}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};