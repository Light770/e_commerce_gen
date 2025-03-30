import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface ErrorResponse {
  detail?: string;
}
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          { refresh_token: refreshToken }
        );
        
        const { access_token, refresh_token } = response.data;
        
        Cookies.set('access_token', access_token);
        Cookies.set('refresh_token', refresh_token);
        
        // Update the authorization header
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${access_token}`,
        };
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    const errorMessage = (error.response?.data as ErrorResponse)?.detail || 'An error occurred';
    toast.error(errorMessage);
    
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },
  
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },
};