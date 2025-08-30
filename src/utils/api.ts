export interface Component {
  id: string;
  name?: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ComponentAPI {
  private static baseUrl = '/api';

  static async createComponent(code: string, name?: string): Promise<Component> {
    const response = await fetch(`${this.baseUrl}/component`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, name }),
    });

    const result: ApiResponse<Component> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create component');
    }

    return result.data;
  }

  static async getComponent(id: string): Promise<Component> {
    const response = await fetch(`${this.baseUrl}/preview/${id}`);
    
    const result: ApiResponse<Component> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get component');
    }

    return result.data;
  }

  static async updateComponent(id: string, code: string, name?: string): Promise<Component> {
    const response = await fetch(`${this.baseUrl}/component/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, name }),
    });

    const result: ApiResponse<Component> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update component');
    }

    return result.data;
  }
}