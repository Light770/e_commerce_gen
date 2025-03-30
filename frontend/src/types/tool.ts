export interface Tool {
    id: number;
    name: string;
    description: string;
    icon: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface ToolUsage {
    id: number;
    user_id: number;
    tool_id: number;
    status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    input_data: any;
    result_data: any;
    started_at: string;
    completed_at?: string;
    tool?: Tool;
  }
  
  export interface SavedProgress {
    id: number;
    user_id: number;
    tool_id: number;
    form_data: any;
    saved_at: string;
    tool?: Tool;
  }