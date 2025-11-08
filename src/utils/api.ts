import { projectId as supabaseProjectId, publicAnonKey } from './supabase/info';
import { demoModeAPI, enableDemoMode, isDemoMode } from './demo-mode';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * API CLIENT - RECOMPILACION NUCLEAR V9.1 - WINDOW.FETCH FORZADO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CAMBIOS CRITICOS APLICADOS EN V9.1:
 * ⚡ NUEVO: Cambiado fetch() → window.fetch() en TODO el frontend
 * ⚡ CRÍTICO: window.fetch ignora polyfills corruptos de node-fetch
 * ✅ Eliminado @supabase/supabase-js del frontend
 * ✅ Uso EXCLUSIVO de window.fetch nativo del navegador
 * ✅ NO hay dependencias externas de fetch (node-fetch eliminado)
 * ✅ Nuevos endpoints: /login y /signup devuelven tokens JWT
 * ✅ AuthManager gestiona persistencia de tokens
 * 
 * ARQUITECTURA:
 * Frontend (React) → window.fetch → Backend (Deno) → Supabase Auth
 * 
 * POR QUÉ window.fetch:
 * - fetch() puede ser interceptado por polyfills del bundler
 * - window.fetch fuerza el uso de la API nativa del navegador
 * - Evita conflictos con node-fetch que causan "Failed to fetch"
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Export projectId for use in other modules
export const projectId = supabaseProjectId;

// Base URL del servidor backend (Edge Function)
// ⚠️ CRÍTICO: La función se llama "server" (nombre de la Edge Function desplegada)
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server/make-server-05c2b65f`;

export class ApiClient {
  private token: string | null = null;
  private useDemoMode = false;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  /**
   * Makes an HTTP request to the API server.
   * Returns the raw Response object instead of throwing errors on HTTP error codes.
   * This allows the calling code to properly handle different status codes (401, 404, 500, etc.)
   * Use handleResponse() to process the Response object.
   */
  private async request(endpoint: string, options: RequestInit = {}) {
    // Check if demo mode is enabled
    if (isDemoMode() || this.useDemoMode) {
      throw new Error('DEMO_MODE');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    try {
      const fullUrl = `${BASE_URL}${endpoint}`;
      
      // CAMBIO CRÍTICO: Usar window.fetch explícitamente para evitar conflictos 
      // con polyfills dañados de node-fetch. Esto fuerza el uso del fetch nativo del navegador.
      const response = await window.fetch(fullUrl, {
        ...options,
        headers,
      });

      // Return the response object directly, letting the calling code handle status codes
      // This allows proper error handling for 401, 404, 500, etc.
      return response;
    } catch (error: any) {
      // Network errors (true fetch failures, not HTTP errors) trigger demo mode
      console.error('[EduConnect] Error de red real (TypeError):', error);
      
      if (error.message === 'DEMO_MODE') {
        throw error;
      }
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        console.log('[EduConnect] Network error detected, enabling demo mode');
        enableDemoMode();
        this.useDemoMode = true;
        throw new Error('DEMO_MODE');
      }
      throw error;
    }
  }

  /**
   * Processes a Response object from the request() method.
   * Handles HTTP error codes and enables demo mode for 403/404 errors.
   * For other errors, extracts error message from response body.
   * For successful responses, parses and returns JSON data.
   */
  private async handleResponse(response: Response) {
    // Handle HTTP error codes
    if (!response.ok) {
      // If 403 or 404, enable demo mode
      if (response.status === 403 || response.status === 404) {
        console.log('[EduConnect] Backend unavailable (status ' + response.status + '), enabling demo mode');
        enableDemoMode();
        this.useDemoMode = true;
        throw new Error('DEMO_MODE');
      }
      
      // For other errors (like 401 Unauthorized), try to get error message from response
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    // Parse JSON response
    return response.json();
  }

  private async handleDemoMode<T>(realFn: () => Promise<T>, demoFn: () => Promise<T>): Promise<T> {
    try {
      return await realFn();
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return await demoFn();
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        return this.handleResponse(response);
      },
      () => demoModeAPI.login(email, password)
    );
  }

  async signup(data: { email: string; password: string; name: string; role: 'teacher' | 'student' }) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/signup', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return this.handleResponse(response);
      },
      () => demoModeAPI.signup(data)
    );
  }

  async getCurrentUser() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/user');
        return this.handleResponse(response);
      },
      () => demoModeAPI.getCurrentUser()
    );
  }

  async createAssignment(data: any) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/assignments', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return this.handleResponse(response);
      },
      () => demoModeAPI.createAssignment(data)
    );
  }

  async getAssignments() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/assignments');
        return this.handleResponse(response);
      },
      () => demoModeAPI.getAssignments()
    );
  }

  async getAssignment(id: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/assignments/${id}`);
        return this.handleResponse(response);
      },
      () => demoModeAPI.getAssignment(id)
    );
  }

  async updateAssignment(id: string, data: any) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/assignments/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        return this.handleResponse(response);
      },
      () => demoModeAPI.updateAssignment(id, data)
    );
  }

  async deleteAssignment(id: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/assignments/${id}`, {
          method: 'DELETE',
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.deleteAssignment(id);
        return {};
      }
    );
  }

  async submitAssignment(data: any) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/submissions', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return this.handleResponse(response);
      },
      () => demoModeAPI.submitAssignment(data)
    );
  }

  async getAssignmentSubmissions(assignmentId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/assignments/${assignmentId}/submissions`);
        return this.handleResponse(response);
      },
      () => demoModeAPI.getAssignmentSubmissions(assignmentId)
    );
  }

  async gradeSubmission(submissionId: string, data: { grade: number; feedback: string }) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/submissions/${submissionId}/grade`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.gradeSubmission(submissionId, data);
        return {};
      }
    );
  }

  async getMySubmissions() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/my-submissions');
        return this.handleResponse(response);
      },
      () => demoModeAPI.getMySubmissions()
    );
  }

  async uploadFile(file: File) {
    // File upload in demo mode returns placeholder
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.uploadFile(file);
    }

    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    try {
      const response = await window.fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          enableDemoMode();
          this.useDemoMode = true;
          return demoModeAPI.uploadFile(file);
        }
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || `Upload failed with status ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        enableDemoMode();
        this.useDemoMode = true;
        return demoModeAPI.uploadFile(file);
      }
      throw error;
    }
  }

  async getStudents() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/students');
        return this.handleResponse(response);
      },
      () => demoModeAPI.getStudents()
    );
  }

  async assignStudent(studentId: string, assign: boolean) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/assign-student', {
          method: 'POST',
          body: JSON.stringify({ studentId, assign }),
        });
        return this.handleResponse(response);
      },
      async () => {
        // Not used in current implementation
        return {};
      }
    );
  }

  async getMyStudents() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/my-students');
        return this.handleResponse(response);
      },
      () => demoModeAPI.getMyStudents()
    );
  }

  async assignTask(assignmentId: string, studentIds: string[]) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/assign-task', {
          method: 'POST',
          body: JSON.stringify({ assignmentId, studentIds }),
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.assignTask(assignmentId, studentIds);
        return {};
      }
    );
  }

  async getAssignedStudents(assignmentId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/assignments/${assignmentId}/assigned-students`);
        return this.handleResponse(response);
      },
      () => demoModeAPI.getAssignedStudents(assignmentId)
    );
  }

  // Admin methods
  async getAllUsers() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/admin/users');
        return this.handleResponse(response);
      },
      () => demoModeAPI.getAllUsers()
    );
  }

  async assignTeacherToStudent(teacherId: string, studentId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/admin/assign-teacher', {
          method: 'POST',
          body: JSON.stringify({ teacherId, studentId }),
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.assignTeacherToStudent(teacherId, studentId);
        return {};
      }
    );
  }

  async unassignTeacherFromStudent(teacherId: string, studentId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/admin/unassign-teacher', {
          method: 'POST',
          body: JSON.stringify({ teacherId, studentId }),
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.unassignTeacherFromStudent(teacherId, studentId);
        return {};
      }
    );
  }

  async deleteUser(userId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/admin/users/${userId}`, {
          method: 'DELETE',
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.deleteUser(userId);
        return {};
      }
    );
  }

  async blockUser(userId: string, blocked: boolean) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/admin/users/${userId}/block`, {
          method: 'POST',
          body: JSON.stringify({ blocked }),
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.blockUser(userId, blocked);
        return {};
      }
    );
  }

  async updateUserProfile(updates: any) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/user/profile', {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        return this.handleResponse(response);
      },
      () => demoModeAPI.updateUserProfile(updates)
    );
  }

  // Notes/Materials methods
  async createNote(data: any) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/notes', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return this.handleResponse(response);
      },
      () => demoModeAPI.createNote(data)
    );
  }

  async getNotes() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/notes');
        return this.handleResponse(response);
      },
      () => demoModeAPI.getNotes()
    );
  }

  async deleteNote(id: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/notes/${id}`, {
          method: 'DELETE',
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.deleteNote(id);
        return {};
      }
    );
  }

  async assignNote(noteId: string, studentIds: string[]) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/assign-note', {
          method: 'POST',
          body: JSON.stringify({ noteId, studentIds }),
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.assignNote(noteId, studentIds);
        return {};
      }
    );
  }

  async getAssignedStudentsForNote(noteId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/notes/${noteId}/assigned-students`);
        return this.handleResponse(response);
      },
      () => demoModeAPI.getAssignedStudentsForNote(noteId)
    );
  }

  async markNoteAsRead(noteId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/notes/${noteId}/mark-read`, {
          method: 'POST',
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.markNoteAsRead(noteId);
        return {};
      }
    );
  }

  async markNoteAsOpened(noteId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/notes/${noteId}/mark-opened`, {
          method: 'POST',
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.markNoteAsOpened(noteId);
        return {};
      }
    );
  }

  // PDF Annotation methods (Not available in demo mode)
  async getPDFAnnotations(assignmentId: string) {
    if (isDemoMode() || this.useDemoMode) {
      return { annotations: [] };
    }
    const response = await this.request(`/pdf-annotations/${assignmentId}`);
    return this.handleResponse(response);
  }

  async savePDFAnnotations(assignmentId: string, annotations: any[]) {
    if (isDemoMode() || this.useDemoMode) {
      return {};
    }
    const response = await this.request(`/pdf-annotations/${assignmentId}`, {
      method: 'POST',
      body: JSON.stringify({ annotations }),
    });
    return this.handleResponse(response);
  }

  async submitPDFAssignment(assignmentId: string) {
    if (isDemoMode() || this.useDemoMode) {
      throw new Error('La entrega de PDF no está disponible en modo demo');
    }
    const response = await this.request(`/pdf-submit/${assignmentId}`, {
      method: 'POST',
    });
    return this.handleResponse(response);
  }

  async getFlattenedPDF(submissionId: string) {
    if (isDemoMode() || this.useDemoMode) {
      throw new Error('La descarga de PDF no está disponible en modo demo');
    }
    const response = await this.request(`/pdf-flattened/${submissionId}`);
    return this.handleResponse(response);
  }
}

export const apiClient = new ApiClient();
