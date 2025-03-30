import { apiService } from './apiService';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await apiService.post<LoginResponse>('authlogin', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse>('authrefresh', {
      refresh_token: refreshToken,
    });
    
    return response.data;
  },
  
  logout: async (refreshToken: string): Promise<void> => {
    await apiService.post('authlogout', {
      refresh_token: refreshToken,
    });
  },
  
  register: async (email: string, password: string, fullName: string): Promise<void> => {
    await apiService.post('authregister', {
      email,
      password,
      confirm_password: password,
      full_name: fullName,
    });
  },
  
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiService.post('authpassword-reset-request', {
      email,
    });
  },
  
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiService.post('authreset-password', {
      token,
      new_password: newPassword,
      confirm_password: newPassword,
    });
  },
  
  verifyEmail: async (token: string): Promise<void> => {
    await apiService.post('authverify-email', {
      token,
    });
  },
};