/*
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  API.TS - V10.6 (SOLUCIÓN FULL-STACK)                                 ║
 * ║  FIX: Eliminada la lógica de intercepción de 'isDemoMode()'           ║
 * ║       que llamaba a 'demoModeAPI.handleRequest' (inexistente)         ║
 * ║       y causaba el crash en bucle.                                    ║
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
    this.serverUrl = localStorage.getItem('educonnect_server_url') || 
                     (import.meta.env.VITE_SUPABASE_URL 
                       ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/server` 
                       : 'http://127.0.0.1:54321/functions/v1/server');
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    
    // <--- INICIO DEL ARREGLO --- >
    // La lógica 'if (isDemoMode())' se eliminó de aquí
    // porque estaba rota y causaba un crash.
    // El 'LoginForm' y otros componentes ya manejan
    // la llamada a 'demoModeAPI' explícitamente cuando es necesario.
    // <--- FIN DEL ARREGLO --- >

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
      console.error(`[ApiClient] Error en fetch: ${err.message}`);
      
      // Manejar errores de red (CORS, offline)
      if (err.message.includes('Failed to fetch')) {
        console.warn(`[ApiClient] 'Failed to fetch'. Activando modo demo.`);
        localStorage.setItem('educonnect_demo_mode', 'true');
        throw new Error('DEMO_MODE');
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
    return this.request('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // --- USERS ---
  async getUsers(role?: 'teacher' | 'student'): Promise<any[]> {
    const endpoint = role ? `/users?role=${role}` : '/users';
    return this.request(endpoint);
  }
  
  // (Esta función no estaba en tu 'api.ts' pero 'App.tsx' la necesita)
  async getUserProfile(userId: string): Promise<any> {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId: string, data: any): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string, data: any): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }
  
  async assignTeacherToStudent(studentId: string, teacherId: string): Promise<any> {
    return this.request(`/users/assign-teacher`, {
      method: 'POST',
      body: JSON.stringify({ studentId, teacherId }),
    });
  }

  async getStudentsForTeacher(teacherId: string): Promise<any[]> {
    return this.request(`/users/teacher/${teacherId}/students`);
  }
  
  async getUnassignedStudents(): Promise<any[]> {
    return this.request('/users/unassigned');
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
    return this.request(`/assignments/${assignmentId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
  }
  
  async getStudentAssignments(studentId: string): Promise<any[]> {
    return this.request(`/assignments/student/${studentId}`);
  }

  // --- SUBMISSIONS ---
  async getAssignmentSubmissions(assignmentId: string): Promise<any> {
    return this.request(`/submissions/assignment/${assignmentId}`);
  }
  
  async getStudentSubmissions(studentId: string): Promise<any[]> {
    // ⚠️ ATENCIÓN: Esta función se llamaba 'getMySubmissions'
    // pero el endpoint es '/submissions/student/:studentId'
    return this.request(`/submissions/student/${studentId}`);
  }
  
  // (Función duplicada de la anterior, pero con el nombre que usa StudentDashboard)
  async getMySubmissions(): Promise<any> {
    const studentId = AuthManager.getUserId();
    if (!studentId) throw new Error("No user logged in");
    return this.request(`/submissions/student/${studentId}`);
  }

  async createSubmission(data: any): Promise<any> {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async updateSubmission(id: string, data: any): Promise<any> {
    return this.request(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
    return this.request(`/notifications/${userId}`);
  }
  
  async markNotificationsAsRead(userId: string, notificationId: string | 'all'): Promise<any> {
    return this.request(`/notifications/read`, {
      method: 'POST',
      body: JSON.stringify({ userId, notificationId }),
    });
  }

  // --- MATERIALS (NOTES) ---
  async getMaterials(teacherId: string): Promise<any> {
    return this.request(`/notes/teacher/${teacherId}`);
  }
  
  async getStudentMaterials(studentId: string): Promise<any> {
    return this.request(`/notes/student/${studentId}`);
  }

  async createMaterial(data: FormData): Promise<any> {
    // FormData se envía diferente, sin 'Content-Type': 'application/json'
    const url = `${this.serverUrl}/notes`;
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
        throw new Error(errData.error || 'Error subiendo archivo');
      }
      return response.json();
    } catch (err: any) {
       console.error(`[ApiClient] Error en fetch (FormData): ${err.message}`);
       throw err;
    }
  }

  async deleteMaterial(noteId: string): Promise<any> {
    return this.request(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }
  
  async assignMaterialToStudents(noteId: string, studentIds: string[]): Promise<any> {
    return this.request(`/notes/${noteId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
  }
  
  async markMaterialAsRead(noteId: string, studentId: string): Promise<any> {
    return this.request(`/notes/${noteId}/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  // --- PDF SESSIONS ---
  async getPDFSessionAnnotations(assignmentId: string, userId: string): Promise<any> {
    return this.request(`/pdf-annotations/${assignmentId}/${userId}`);
  }

  async updatePDFSessionAnnotations(assignmentId: string, userId: string, annotations: any[]): Promise<any> {
    return this.request(`/pdf-annotations/${assignmentId}/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ annotations }),
    });
  }
  
  async getPDFCorrections(assignmentId: string, studentId: string): Promise<any> {
    return this.request(`/pdf-corrections/${assignmentId}/${studentId}`);
  }
  
  async updatePDFCorrections(assignmentId: string, studentId: string, corrections: any[]): Promise<any> {
    return this.request(`/pdf-corrections/${assignmentId}/${studentId}`, {
      method: 'POST',
      body: JSON.stringify({ corrections }),
    });
  }

  async submitPDFTask(assignmentId: string, userId: string, fileUrl: string): Promise<any> {
    // Este método podría simplemente crear una 'submission' normal
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
    const url = `${this.serverUrl}/ai/generate-task`;
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