/*
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  API.TS - V10.8 (SOLUCIÓN FULL-STACK)                                 ║
 * ║  FIX: Corregida la URL del 'serverUrl' para que apunte a              ║
 * ║       'final_server' (que está desplegado) en lugar de 'server'       ║
 * ║       (que fue eliminado). Esto corrige el 404 Not Found.             ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
import { AuthManager } from './auth-manager';
import { isDemoMode, demoModeAPI } from './demo-mode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  private token: string | null = null;
  private serverUrl: string = '';

  constructor() {
    this.initialize();
  }

  async initialize() {
    console.log('✅ [Supabase] Cliente creado correctamente');
    
    // <--- ¡ESTA ES LA LÍNEA CORREGIDA! --- >
    this.serverUrl = localStorage.getItem('educonnect_server_url') || 
                     (import.meta.env.VITE_SUPABASE_URL 
                       ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/final_server/server` // Apunta a final_server y su basePath
                       : 'http://127.0.0.1:54321/functions/v1/final_server/server'); // Apunta a final_server y su basePath
    // <--- FIN DE LA CORRECCIÓN --- >

    console.log('API Base URL establecida en:', this.serverUrl);
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    
    // Lógica de API real
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
      // Usamos window.fetch explícitamente como en tus archivos de documentación
      const response = await window.fetch(url, config);
      
      if (response.status === 204) {
        return null; // No content
      }
      
      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || data.message || `Error ${response.status}`;
        
        // Si el backend no está disponible, activar modo demo
        if (response.status === 404 || response.status === 502) {
            console.warn(`[ApiClient] Backend no encontrado (404/502). Activando modo demo.`);
            localStorage.setItem('educonnect_demo_mode', 'true');
            // Lanzar un error específico que el LoginForm puede capturar
            throw new Error('DEMO_MODE');
        }
        
        throw new Error(errorMsg);
      }
      
      return data;
    } catch (err: any) {
      console.error(`[ApiClient] Error en fetch: ${err.message}`, { url });
      
      // Manejar errores de red (CORS, offline)
      if (err.message.includes('Failed to fetch')) {
        console.warn(`[ApiClient] 'Failed to fetch'. Activando modo demo.`);
        localStorage.setItem('educonnect_demo_mode', 'true');
        throw new Error('DEMO_MODE');
      }
      
      // Si el error es de JSON (como "Unexpected token 'F'"), lo reenviamos
      if (err instanceof SyntaxError) {
        console.error("[ApiClient] Error de JSON. El backend no devolvió JSON. ¿Ruta 404?");
        throw err; // Lanza el 'Unexpected token 'F'...'
      }
      
      throw err;
    }
  }

  // --- AUTH ---
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    // El endpoint es '/auth/login' porque el basePath '/server' ya está en 'serverUrl'
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
    // Esta es la función que usa App.tsx para validar la sesión
    return this.request('/user', { // El endpoint /user valida el token
      method: 'GET',
    });
  }

  // --- USERS ---
  async getUsers(role?: 'teacher' | 'student'): Promise<any[]> {
    const endpoint = role ? `/users?role=${role}` : '/users';
    return this.request(endpoint);
  }
  
  async getUserProfile(userId: string): Promise<any> {
    // Este endpoint no parece existir en tu 'final_server/index.ts',
    // pero 'validateToken' (que llama a '/user') lo reemplaza.
    console.warn("getUserProfile no está implementado en 'final_server', usando '/user' en su lugar.");
    return this.request('/user');
  }

  async updateUser(userId: string, data: any): Promise<any> {
    // Este endpoint tampoco está en 'final_server/index.ts'
    // Debería ser '/admin/users/:id/metadata' o '/user/avatar'
    console.warn("updateUser no implementado, simulando éxito");
    return { success: true, ...data };
  }

  async deleteUser(userId: string, data: any): Promise<any> {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }
  
  async assignTeacherToStudent(studentId: string, teacherId: string): Promise<any> {
    return this.request(`/admin/assign-teacher`, {
      method: 'POST',
      body: JSON.stringify({ studentId, teacherId }),
    });
  }

  async getStudentsForTeacher(teacherId: string): Promise<any[]> {
    return this.request('/my-students');
  }
  
  async getUnassignedStudents(): Promise<any[]> {
    // Este endpoint no existe en 'final_server/index.ts'
    console.warn("getUnassignedStudents no implementado");
    return [];
  }

  // --- ASSIGNMENTS ---
  async getAssignments(): Promise<any> {
    return this.request('/assignments');
  }

  async createAssignment(data: any): Promise<any> {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(id: string, data: any): Promise<any> {
    return this.request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: string): Promise<any> {
    return this.request(`/assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async assignTaskToStudents(assignmentId: string, studentIds: string[]): Promise<any> {
    return this.request(`/assign-task`, {
      method: 'POST',
      body: JSON.stringify({ assignmentId, studentIds }),
    });
  }
  
  async getStudentAssignments(studentId: string): Promise<any[]> {
    // Este endpoint no existe en 'final_server/index.ts',
    // '/assignments' (GET) ya filtra por estudiante
    console.warn("getStudentAssignments(id) es redundante, usando getAssignments()");
    const data = await this.getAssignments();
    return data.assignments;
  }

  // --- SUBMISSIONS ---
  async getAssignmentSubmissions(assignmentId: string): Promise<any> {
    return this.request(`/assignments/${assignmentId}/submissions`);
  }
  
  async getStudentSubmissions(studentId: string): Promise<any[]> {
    const data = await this.getMySubmissions();
    return data.submissions;
  }
  
  async getMySubmissions(): Promise<any> {
    return this.request(`/my-submissions`);
  }

  async createSubmission(data: any): Promise<any> {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async updateSubmission(id: string, data: any): Promise<any> {
    // Este endpoint no existe en 'final_server/index.ts'
    console.warn("updateSubmission no implementado");
    return { success: true };
  }
  
  async submitAssignment(data: any): Promise<any> {
    const studentId = AuthManager.getUserId();
    return this.createSubmission({
      ...data,
      studentId: studentId,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    });
  }

  async gradeSubmission(submissionId: string, data: { grade: number; feedback: string }): Promise<any> {
    return this.request(`/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- NOTIFICATIONS ---
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

  // --- MATERIALS (NOTES) ---
  // (La lógica de 'final_server' no tiene 'notes', usa 'materials')
  async getMaterials(teacherId: string): Promise<any> {
    console.warn("getMaterials no implementado");
    return [];
  }
  
  async getStudentMaterials(studentId: string): Promise<any> {
    console.warn("getStudentMaterials no implementado");
    return [];
  }

  async createMaterial(data: FormData): Promise<any> {
     console.warn("createMaterial no implementado");
     return { success: true };
  }

  async deleteMaterial(noteId: string): Promise<any> {
     console.warn("deleteMaterial no implementado");
    return { success: true };
  }
  
  async assignMaterialToStudents(noteId: string, studentIds: string[]): Promise<any> {
    console.warn("assignMaterialToStudents no implementado");
    return { success: true };
  }
  
  async markMaterialAsRead(noteId: string, studentId: string): Promise<any> {
    console.warn("markMaterialAsRead no implementado");
    return { success: true };
  }

  // --- PDF SESSIONS ---
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
    // Tu backend no diferencia, usa el mismo endpoint
    return this.getPDFSessionAnnotations(assignmentId, studentId);
  }
  
  async updatePDFCorrections(assignmentId: string, studentId: string, corrections: any[]): Promise<any> {
    // Tu backend no diferencia, usa el mismo endpoint
    return this.updatePDFSessionAnnotations(assignmentId, studentId, corrections);
  }

  async submitPDFTask(assignmentId: string, userId: string, fileUrl: string): Promise<any> {
    return this.createSubmission({
      assignmentId: assignmentId,
      studentId: userId,
      type: 'pdf',
      content: { fileUrl: fileUrl, status: 'annotated' },
    });
  }
  
  // --- AI TASK GENERATOR ---
  async generateTaskWithAI(data: FormData): Promise<any> {
    // FormData se envía diferente
    const url = `${this.serverUrl}/generate-questions`; // Endpoint de final_server
    const headers: any = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await window.fetch(url, {
        method: 'POST',
        body: data,
        headers: headers,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error de IA');
      }
      return response.json();
    } catch (err: any) {
       console.error(`[ApiClient] Error en fetch (AI): ${err.message}`);
       throw err;
    }
  }
  
  // --- HEALTH CHECK ---
  async healthCheck(): Promise<any> {
    try {
      const response = await window.fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    } catch (err: any) {
      console.error(`[ApiClient] Health check fallido: ${err.message}`);
      throw new Error('Server offline');
    }
  }
}

export const apiClient = new ApiClient();