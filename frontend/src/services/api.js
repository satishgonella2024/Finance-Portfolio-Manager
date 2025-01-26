const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };
  
  export const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });
  
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
  
    return response;
  };
  
  // Common API endpoints
  export const api = {
    login: async (email, password) => {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return response.json();
    },
  
    register: async (email, password) => {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return response.json();
    },
  
    // Portfolio endpoints
    getPortfolios: () => 
      fetchWithAuth('http://localhost:3000/api/portfolio'),
  
    createPortfolio: (name) => 
      fetchWithAuth('http://localhost:3000/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({ name })
      }),
  
    addHolding: (portfolioId, holding) => 
      fetchWithAuth(`http://localhost:3000/api/portfolio/${portfolioId}/holdings`, {
        method: 'POST',
        body: JSON.stringify(holding)
      }),
  
    deleteHolding: (portfolioId, holdingId) => 
      fetchWithAuth(`http://localhost:3000/api/portfolio/${portfolioId}/holdings/${holdingId}`, {
        method: 'DELETE'
      })
  };