/*
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  API.TS - V11 (REINICIO DE LÓGICA)                                    ║
 * ║  FIX: Apuntando 'serverUrl' a la función 'server' Y a su 'basePath'   ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
import { AuthManager } from './auth-manager';
import { isDemoMode, demoModeAPI } from './demo-mode';

class ApiClient {
  private token: string | null = null;
  private serverUrl: string = '';

  constructor() {
    this.initialize();
  }

  async initialize() {
    console.log('✅ [Supabase] Cliente creado correctamente');
    
    // Esta es la ruta que el servidor local (supabase start) expondrá:
    // http://127.0.0.1:54321/functions/v1/ [NOMBRE_FUNCION] / [BASE_PATH]
    const FUNCTIONS_BASE_URL = import.meta.env.VITE_SUPABASE_URL
      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
      : 'http://127.0.0.1:54321/functions/v1';

    // Apuntamos a la función 'server' y a su 'basePath' interno ('/server')
    this.serverUrl = `${FUNCTIONS_BASE_URL}/server/server`;
    
    console.log('API Base URL establecida en:', this.serverUrl);
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.serverUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as any)['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await window.fetch(url, config);
      
      if (response.status === 204) {
        return null; // No content
      }
      
      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || data.message || `Error ${response.status}`;
        
        if (response.status === 404 || response.status === 502) {
            console.warn(`[ApiClient] Backend no encontrado (404/502). Activando modo demo.`);
            localStorage.setItem('educonnect_demo_mode', 'true');
            throw new Error('DEMO_MODE');
        }
        
        throw new Error(errorMsg);
      }
      
      return data;
    } catch (err: any) {
      console.error(`[ApiClient] Error en fetch: ${err.message}`, { url });
      
      if (err.message.includes('Failed to fetch')) {
        console.warn(`[ApiClient] 'Failed to fetch'. Activando modo demo.`);
        localStorage.setItem('educonnect_demo_mode', 'true');
        throw new Error('DEMO_MODE');
      }
      
      if (err instanceof SyntaxError) {
        console.error("[ApiClient] Error de JSON. El backend no devolvió JSON. ¿Ruta 404?");
        throw err;
      }
      
      throw err;
    }
  }

  // --- AUTH ---
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(data: any): Promise<{ user: any; token: string }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateToken(token: string): Promise<{ user: any }> {
    return this.request('/user', {
      method: 'GET',
    });
  }

  // --- USERS ---
  async getUserProfile(userId: string): Promise<any> {
    return this.request(`/admin/users/${userId}`); // Asumiendo que existe, o necesita un endpoint /users/:id
  }
  
  // (El resto de las funciones...)
  // (Pego solo las funciones clave para brevedad, el resto de tu api.ts está bien)

  async getAssignments(): Promise<any> {
    return this.request('/assignments');
  }
  
  async getMySubmissions(): Promise<any> {
    const studentId = AuthManager.getUserId();
    if (!studentId) {
       // Manejar modo demo o error si el ID no está
       if(isDemoMode()) return demoModeAPI.getMySubmissions();
       throw new Error("No user logged in");
    }
    return this.request(`/my-submissions`);
  }
  
  async submitAssignment(data: any): Promise<any> {
    const studentId = AuthManager.getUserId();
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        studentId: studentId,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
      }),
    });
  }
  
  async getNotifications(userId: string): Promise<any> {
    return this.request(`/notifications`);
  }
  
  async markNotificationsAsRead(userId: string, notificationId: string | 'all'): Promise<any> {
    const ids = notificationId === 'all' ? [] : [notificationId];
    if(notificationId === 'all') {
      return this.request(`/notifications/mark-all-read`, { method: 'POST' });
    }
    return this.request(`/notifications/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ notificationIds: ids }),
    });
  }
  
  async getPDFSessionAnnotations(assignmentId: string, userId: string): Promise<any> {
    return this.request(`/annotations/${assignmentId}`);
  }

  async updatePDFSessionAnnotations(assignmentId: string, userId: string, annotations: any[]): Promise<any> {
    return this.request(`/annotations`, {
      method: 'POST',
      body: JSON.stringify({ assignmentId, annotations }),
    });
  }
  
  async getPDFCorrections(assignmentId: string, studentId: string): Promise<any> {
    return this.getPDFSessionAnnotations(assignmentId, studentId);
  }
  
  async updatePDFCorrections(assignmentId: string, studentId: string, corrections: any[]): Promise<any> {
    return this.updatePDFSessionAnnotations(assignmentId, studentId, corrections);
  }
  
  async gradeSubmission(submissionId: string, data: { grade: number; feedback: string }): Promise<any> {
    return this.request(`/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async getAssignmentSubmissions(assignmentId: string): Promise<any> {
    return this.request(`/assignments/${assignmentId}/submissions`);
  }
  
  // (El resto de funciones...)
}

export const apiClient = new ApiClient();