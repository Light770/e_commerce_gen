export interface User {
    id: number;
    email: string;
    roles: string[];
    full_name?: string;
    is_verified?: boolean;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface UserCreateForm {
    email: string;
    password: string;
    confirm_password: string;
    full_name: string;
  }
  
  export interface UserUpdateForm {
    full_name?: string;
    password?: string;
    new_password?: string;
  }
  
  export interface LoginForm {
    email: string;
    password: string;
    remember_me: boolean;
  }
  
  export interface PasswordResetRequestForm {
    email: string;
  }
  
  export interface PasswordResetForm {
    token: string;
    new_password: string;
    confirm_password: string;
  }