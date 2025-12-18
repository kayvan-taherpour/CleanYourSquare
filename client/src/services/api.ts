const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async () => {
    return apiRequest<any>('/auth/me');
  },
};

// Clients API
export const clientsAPI = {
  getAll: async (params?: { status?: string; type?: string; search?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<{ success: boolean; data: any[]; total: number }>(`/clients${queryString}`);
  },
  getById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/clients/${id}`);
  },
  create: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/clients/${id}`, {
      method: 'DELETE',
    });
  },
};

// Employees API
export const employeesAPI = {
  getAll: async (params?: { role?: string; employmentType?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<{ success: boolean; data: any[]; total: number }>(`/employees${queryString}`);
  },
  getById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/employees/${id}`);
  },
  create: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/employees/${id}`, {
      method: 'DELETE',
    });
  },
};

// Bookings API
export const bookingsAPI = {
  getAll: async (params?: { status?: string; client?: string; employee?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<{ success: boolean; data: any[]; total: number }>(`/bookings${queryString}`);
  },
  getById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/bookings/${id}`);
  },
  create: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/bookings/${id}`, {
      method: 'DELETE',
    });
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (params?: { status?: string; client?: string; type?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<{ success: boolean; data: any[]; total: number }>(`/transactions${queryString}`);
  },
  getById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/transactions/${id}`);
  },
  create: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },
  getStatistics: async () => {
    return apiRequest<{ success: boolean; data: any }>('/transactions/statistics');
  },
};



