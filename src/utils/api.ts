import { projectId as supabaseProjectId, publicAnonKey } from './supabase/info';
import { demoModeAPI, enableDemoMode, isDemoMode } from './demo-mode';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * EDUCONNECT API CLIENT v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Cliente API para comunicación con backend Supabase
 * - Autenticación con JWT
 * - Modo demo automático si backend no disponible
 * - Uso de fetch nativo del navegador
 * 
 * IMPORTANTE: Actualiza projectId en /utils/supabase/info.tsx
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Export projectId for use in other modules
export const projectId = supabaseProjectId;

// Base URL del servidor backend (Edge Function llamada "server")
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server`;

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
    // Check if using placeholder credentials - activate demo mode immediately
    if (projectId === "DEMO_MODE" || projectId === "TU_PROJECT_ID_AQUI" || !projectId) {
      if (!isDemoMode()) {
        console.log('[EduConnect] 🔴 Credenciales no configuradas - activando modo DEMO automáticamente');
        enableDemoMode();
      }
      throw new Error('DEMO_MODE');
    }

    // Check if demo mode is enabled
    if (isDemoMode() || this.useDemoMode) {
      throw new Error('DEMO_MODE');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': publicAnonKey, // ✅ CRÍTICO: Header requerido por Supabase
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    try {
      const fullUrl = `${BASE_URL}${endpoint}`;
      
      // 🚀 ARREGLO: Aumentar timeout a 30 segundos para consultas pesadas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      // CAMBIO CRÍTICO: Usar window.fetch explícitamente para evitar conflictos 
      // con polyfills dañados de node-fetch. Esto fuerza el uso del fetch nativo del navegador.
      const response = await window.fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal, // 🚀 Agregar signal para timeout
      });

      clearTimeout(timeoutId); // Limpiar timeout si la request completa

      // Return the response object directly, letting the calling code handle status codes
      // This allows proper error handling for 401, 404, 500, etc.
      return response;
    } catch (error: any) {
      // 🔧 Silenciar AbortError - es esperado cuando hay timeouts
      const isAbortError = error.name === 'AbortError' || error.message?.includes('aborted');
      
      // Network errors (true fetch failures, not HTTP errors) trigger demo mode
      // No mostrar errores innecesarios si ya estamos en modo demo
      if (!this.useDemoMode && !isAbortError) {
        console.log('[EduConnect] ⚠️ Backend no disponible, activando modo demo');
      }
      
      // Si ya es un error de DEMO_MODE, re-lanzarlo
      if (error.message === 'DEMO_MODE') {
        throw error;
      }
      
      // 🔧 ARREGLO: Activar modo demo para cualquier error de fetch/network
      const isFetchError = 
        isAbortError || 
        error.message === 'Failed to fetch' || 
        error.name === 'TypeError' ||
        error.message?.includes('fetch') ||
        error.message?.includes('Network');
        
      if (isFetchError) {
        if (!this.useDemoMode && !isDemoMode()) {
          console.log('[EduConnect] ⚡ Activando modo demo por timeout/network error');
          enableDemoMode();
          this.useDemoMode = true;
        }
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
      // 🔧 ARREGLO: Para 404, solo mostrar warning en consola sin error visible
      if (response.status === 404) {
        const url = response.url;
        console.warn(`⚠️ [API] Endpoint no disponible (404): ${url}`);
        console.log('ℹ️ [API] Usando fallback a localStorage/demo mode');
        
        // Si el usuario NO está autenticado, activar modo demo
        if (!this.token) {
          console.log('[EduConnect] Backend unavailable (status 404), enabling demo mode');
          enableDemoMode();
          this.useDemoMode = true;
        }
        
        throw new Error('Request failed');
      }
      
      // If 403 AND user is NOT authenticated, enable demo mode
      if (response.status === 403 && !this.token) {
        console.log('[EduConnect] Backend unavailable (status ' + response.status + '), enabling demo mode');
        enableDemoMode();
        this.useDemoMode = true;
        throw new Error('DEMO_MODE');
      }
      
      // Para otros errores (500, 401, etc.), extraer mensaje y lanzar error
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = error.error || error.message || `Request failed with status ${response.status}`;
      
      console.error(`❌ [API] Error ${response.status}:`, errorMessage);
      throw new Error(errorMessage);
    }

    // Parse JSON response
    return response.json();
  }

  private async handleDemoMode<T>(realFn: () => Promise<T>, demoFn: () => Promise<T>): Promise<T> {
    try {
      return await realFn();
    } catch (error: any) {
      // 🔧 ARREGLO: Activar modo demo para errores de autenticación también
      const shouldUseDemoMode = 
        error.message === 'DEMO_MODE' || 
        error.message === 'Failed to fetch' || 
        error.message === 'Unauthorized' ||
        error.name === 'TypeError' ||
        error.message?.includes('fetch') ||
        error.message?.includes('Network') ||
        error.message?.includes('aborted');
      
      if (shouldUseDemoMode) {
        if (error.message !== 'DEMO_MODE') {
          console.log('[EduConnect] ⚠️ Error de conexión detectado:', error.message);
        }
        
        if (!isDemoMode() && !this.useDemoMode) {
          console.log('[EduConnect] ⚡ Activando modo demo automáticamente');
          enableDemoMode();
          this.useDemoMode = true;
        }
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
    const result = await this.handleDemoMode(
      async () => {
        const response = await this.request('/submissions', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return this.handleResponse(response);
      },
      async () => {
        const submissionResult = await demoModeAPI.submitAssignment(data);
        
        // 🔔 Crear notificación para el profesor
        try {
          const { NotificationManager } = await import('./notifications');
          const assignment = await demoModeAPI.getAssignment(data.assignmentId);
          const student = await demoModeAPI.getCurrentUser();
          
          if (assignment && student) {
            NotificationManager.addNotification('teacher', {
              type: 'submission_received',
              title: '📬 Nueva Entrega Recibida',
              message: `${student.user.name} entregó "${assignment.assignment.title}"`,
              assignmentId: data.assignmentId,
              submissionId: submissionResult.submission.id,
              studentId: student.user.id,
              targetTab: 'grades'
            });
          }
        } catch (e) {
          console.error('[ApiClient] Error creando notificación:', e);
        }
        
        return submissionResult;
      }
    );

    // 🔔 Disparar evento de nueva entrega para notificaciones en tiempo real
    console.log('🔔 [ApiClient] Disparando evento submission-added:', data);
    const event = new CustomEvent('submission-added', { 
      detail: { 
        assignmentId: data.assignmentId, 
        submissionId: result.submission?.id,
        timestamp: new Date().toISOString()
      } 
    });
    window.dispatchEvent(event);

    return result;
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

  // 🚀 OPTIMIZACIÓN: Obtener TODAS las submissions de TODAS las tareas de una vez
  async getAllTeacherSubmissions() {
    return this.handleDemoMode(
      async () => {
        // 🔥 SIMPLE: Devolver array vacío y dejar que el componente cargue una por una
        // Esto evita el error 500 de Supabase
        return { submissions: [] };
      },
      () => demoModeAPI.getAllSubmissions()
    );
  }

  async gradeSubmission(submissionId: string, data: { grade: number; feedback: string }) {
    const result = await this.handleDemoMode(
      async () => {
        const response = await this.request(`/submissions/${submissionId}/grade`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.gradeSubmission(submissionId, data);
        
        // 🔔 Crear notificación para el estudiante
        try {
          const { NotificationManager } = await import('./notifications');
          const submissions = await demoModeAPI.getSubmissions();
          const submission = submissions.find((s: any) => s.id === submissionId);
          
          if (submission) {
            const notifType = data.feedback ? 'new_feedback' : 'new_grade';
            const title = data.feedback ? '💬 Nuevo Comentario' : '⭐ Nueva Calificación';
            const message = data.feedback 
              ? `Recibiste un comentario en "${submission.assignmentTitle}": ${data.feedback.substring(0, 50)}${data.feedback.length > 50 ? '...' : ''}`
              : `Tu tarea "${submission.assignmentTitle}" fue calificada: ${data.grade}/100`;
            
            NotificationManager.addNotification('student', {
              type: notifType,
              title,
              message,
              assignmentId: submission.assignmentId,
              submissionId: submission.id,
              targetTab: 'submissions'
            });
          }
        } catch (e) {
          console.error('[ApiClient] Error creando notificación de calificación:', e);
        }
        
        return {};
      }
    );

    return result;
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
    // 🔧 NUEVO: Usar Supabase Storage en lugar de Data URLs
    console.log('📤 [Upload] Subiendo archivo a Supabase Storage:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    try {
      // Límite de 10MB
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new Error(`Archivo demasiado grande. Máximo: ${MAX_SIZE / 1024 / 1024}MB`);
      }

      // 🚀 USAR SUPABASE STORAGE
      const { uploadFileToStorage } = await import('./supabase/client');
      const uploadedFile = await uploadFileToStorage(file);

      console.log('✅ [Upload] Archivo subido exitosamente a Supabase Storage:', uploadedFile);

      return uploadedFile;
    } catch (error: any) {
      // 🔧 ARREGLO: Solo mostrar advertencia si NO es error de RLS
      if (error.message === 'RLS_ERROR' || error.message?.includes('row-level security')) {
        console.log('ℹ️ [Upload] Modo demo: usando Data URL en lugar de Supabase Storage');
      } else if (error.message?.includes('SUPABASE_CLIENT_NOT_AVAILABLE')) {
        console.log('ℹ️ [Upload] Supabase no configurado: usando Data URL');
      } else {
        console.log('ℹ️ [Upload] Usando Data URL (modo sin backend)');
      }
      
      // 🔄 FALLBACK: Si falla Supabase, usar Data URL SIEMPRE (sin mostrar error al usuario)
      console.log('🔄 [Upload] Usando Data URL (modo sin backend)...');
      
      try {
        // Convertir el archivo a Data URL directamente en el navegador
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Error reading file'));
          reader.readAsDataURL(file);
        });

        console.log('✅ [Upload] Archivo convertido a Data URL (modo sin backend)');

        return {
          id: crypto.randomUUID(),
          url: dataUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        };
      } catch (fallbackError: any) {
        console.error('❌ [Upload] Error en fallback:', fallbackError);
        throw new Error('No se pudo procesar el archivo. Intenta con un archivo más pequeño.');
      }
    }
  }

  // Anotaciones en PDFs
  async saveAnnotations(assignmentId: string, annotations: any[]) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/annotations', {
          method: 'POST',
          body: JSON.stringify({ assignmentId, annotations }),
        });
        return this.handleResponse(response);
      },
      async () => {
        // En demo mode, guardar en localStorage
        localStorage.setItem(`annotations_${assignmentId}`, JSON.stringify(annotations));
        return { success: true };
      }
    );
  }

  async getAnnotations(assignmentId: string) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/annotations/${assignmentId}`);
        return this.handleResponse(response);
      },
      async () => {
        // En demo mode, cargar de localStorage
        const saved = localStorage.getItem(`annotations_${assignmentId}`);
        return { annotations: saved ? JSON.parse(saved) : [] };
      }
    );
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

  async updateUserMetadata(userId: string, metadata: { name?: string; role?: string; avatar?: string }) {
    return this.handleDemoMode(
      async () => {
        const response = await this.request(`/admin/users/${userId}/metadata`, {
          method: 'PUT',
          body: JSON.stringify(metadata),
        });
        return this.handleResponse(response);
      },
      async () => {
        await demoModeAPI.updateUserMetadata(userId, metadata);
        return {};
      }
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

  // Submissions methods
  async getSubmissions() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/submissions');
        return this.handleResponse(response);
      },
      async () => {
        const submissions = await demoModeAPI.getSubmissions();
        return submissions;
      }
    );
  }

  async updateSubmission(submissionId: string, data: any) {
    // 🔧 ARREGLO: Este endpoint no existe en el backend, usar siempre modo demo
    console.log('[API] updateSubmission - usando modo demo (endpoint no disponible)');
    await demoModeAPI.updateSubmission(submissionId, data);
    return {};
  }

  async getUsers() {
    return this.handleDemoMode(
      async () => {
        const response = await this.request('/users');
        return this.handleResponse(response);
      },
      () => demoModeAPI.getAllUsers()
    );
  }

  // PDF Session methods (for PDFAnnotator)
  async updatePDFSessionAnnotations(assignmentId: string, studentId: string, annotations: any[]) {
    // 🔧 ARREGLO: Este endpoint no existe en el backend, usar siempre localStorage
    console.log('[API] updatePDFSessionAnnotations - usando localStorage (endpoint no disponible)');
    
    try {
      const key = `pdf_annotations_${assignmentId}_${studentId}`;
      localStorage.setItem(key, JSON.stringify(annotations));
      console.log('[API] ✅ Anotaciones guardadas en localStorage:', {
        key,
        count: annotations.length
      });
      return { success: true };
    } catch (error) {
      console.error('[API] ❌ Error guardando en localStorage:', error);
      throw error;
    }
  }

  async getPDFSessionAnnotations(assignmentId: string, studentId: string) {
    // 🔧 ARREGLO: Este endpoint no existe en el backend, usar siempre localStorage
    const key = `pdf_annotations_${assignmentId}_${studentId}`;
    const saved = localStorage.getItem(key);
    console.log('[API] ✅ Anotaciones cargadas desde localStorage');
    return { annotations: saved ? JSON.parse(saved) : [] };
  }

  async lockPDFSession(assignmentId: string, studentId: string, locked: boolean) {
    // 🔧 ARREGLO: Este endpoint no existe en el backend, usar siempre localStorage
    const key = `pdf_locked_${assignmentId}_${studentId}`;
    localStorage.setItem(key, JSON.stringify(locked));
    console.log('[API] ✅ Estado de bloqueo guardado en localStorage');
    return { success: true };
  }

  // 🆕 PDF Corrections methods (for teacher grading)
  async updatePDFCorrections(assignmentId: string, studentId: string, corrections: any[]) {
    // 🔧 ARREGLO: Este endpoint no existe en el backend, usar siempre localStorage
    console.log('[API] updatePDFCorrections - usando localStorage (endpoint no disponible)');
    
    try {
      const key = `pdf_corrections_${assignmentId}_${studentId}`;
      localStorage.setItem(key, JSON.stringify(corrections));
      console.log('[API] ✅ Correcciones guardadas en localStorage:', {
        key,
        count: corrections.length
      });
      return { success: true };
    } catch (error) {
      console.error('[API] ❌ Error guardando correcciones en localStorage:', error);
      throw error;
    }
  }

  async getPDFCorrections(assignmentId: string, studentId: string) {
    // 🔧 ARREGLO: Este endpoint no existe en el backend, usar siempre localStorage
    const key = `pdf_corrections_${assignmentId}_${studentId}`;
    const saved = localStorage.getItem(key);
    console.log('[API] ✅ Correcciones cargadas desde localStorage');
    return { corrections: saved ? JSON.parse(saved) : [] };
  }

  async submitPDFTask(assignmentId: string, studentId: string, pdfUrl?: string) {
    // 🔧 NUEVO: Obtener el PDF anotado que se generó al enviar
    const annotatedPDFKey = `annotated_pdf_${assignmentId}_${studentId}`;
    const annotatedPDFData = localStorage.getItem(annotatedPDFKey);
    
    console.log('🔥🔥🔥 [API.submitPDFTask] INICIO - DATOS RECIBIDOS:', {
      assignmentId,
      studentId,
      pdfUrl,
      annotatedPDFKey,
      annotatedPDFData: annotatedPDFData ? 'EXISTE' : 'NO EXISTE',
      annotatedPDFDataLength: annotatedPDFData?.length || 0
    });
    
    let annotatedPDFFile = null;
    if (annotatedPDFData) {
      try {
        annotatedPDFFile = JSON.parse(annotatedPDFData);
        console.log('🔥🔥🔥 [API.submitPDFTask] PDF ANOTADO ENCONTRADO:', {
          nombre: annotatedPDFFile.name,
          tipo: annotatedPDFFile.type,
          tamaño: annotatedPDFFile.size,
          url: annotatedPDFFile.url?.substring(0, 50) + '...',
          uploadedAt: annotatedPDFFile.uploadedAt
        });
      } catch (e) {
        console.warn('❌ [API.submitPDFTask] No se pudo parsear PDF anotado:', e);
      }
    } else {
      console.log('⚠️ [API.submitPDFTask] NO SE ENCONTRÓ PDF ANOTADO EN LOCALSTORAGE');
    }
    
    // Obtener las anotaciones guardadas (se guardan en pdf_annotations_)
    const annotationsKey = `pdf_annotations_${assignmentId}_${studentId}`;
    const annotationsData = localStorage.getItem(annotationsKey);
    
    let annotations: any[] = [];
    let finalPdfUrl = pdfUrl || '';
    
    if (annotationsData) {
      try {
        annotations = JSON.parse(annotationsData);
      } catch (e) {
        console.warn('[API] No se pudo parsear annotations');
      }
    }
    
    // Si no se pasó pdfUrl, intentar obtenerlo de alguna tarea assignment
    if (!finalPdfUrl) {
      try {
        const assignment = await this.getAssignment(assignmentId);
        if (assignment?.assignment?.pdfUrl) {
          finalPdfUrl = assignment.assignment.pdfUrl;
        }
      } catch (e) {
        console.warn('[API] No se pudo obtener pdfUrl de la tarea');
      }
    }
    
    // 🔧 NUEVO: Incluir el PDF anotado en los archivos adjuntos
    const files = [];
    if (annotatedPDFFile) {
      files.push({
        url: annotatedPDFFile.url,
        name: annotatedPDFFile.name,
        type: annotatedPDFFile.type,
        size: annotatedPDFFile.size,
        uploadedAt: annotatedPDFFile.uploadedAt
      });
      console.log('🔥🔥🔥 [API.submitPDFTask] FILES ARRAY CREADO:', files);
    } else {
      console.log('❌❌❌ [API.submitPDFTask] FILES ARRAY VACÍO - annotatedPDFFile es NULL');
    }
    
    // Crear submission usando el método estándar
    const submissionData = {
      assignmentId,
      studentId,
      type: 'pdf',
      content: JSON.stringify({ pdfUrl: finalPdfUrl, annotations }),
      pdfUrl: finalPdfUrl,
      annotations,
      files, // 🔧 NUEVO: Incluir archivos adjuntos (PDF anotado)
      submittedAt: new Date().toISOString(),
    };
    
    console.log('🔥🔥🔥 [API.submitPDFTask] SUBMISSION DATA FINAL:', {
      assignmentId: submissionData.assignmentId,
      studentId: submissionData.studentId,
      type: submissionData.type,
      hasFiles: !!submissionData.files,
      filesCount: submissionData.files?.length || 0,
      filesDetail: submissionData.files,
      annotationsCount: submissionData.annotations?.length || 0
    });
    
    // Si ya estamos en modo demo, usar directamente la versión local
    if (isDemoMode() || this.useDemoMode) {
      // Usar submitAssignment para crear la submission real
      const result = await this.submitAssignment(submissionData);
      
      // Marcar como enviada también
      const key = `pdf_submitted_${assignmentId}_${studentId}`;
      localStorage.setItem(key, JSON.stringify({ submitted: true, submittedAt: new Date().toISOString() }));
      console.log('[API] ✅ Tarea PDF enviada con submission creada (modo demo)');
      return { success: true, message: 'Tarea enviada (modo demo)', submission: result.submission };
    }

    // Intentar enviar al backend, pero si falla, crear submission local
    try {
      const response = await this.request('/pdf-sessions/submit', {
        method: 'POST',
        body: JSON.stringify(submissionData),
      });
      const result = await this.handleResponse(response);
      console.log('[API] ✅ Tarea enviada al backend exitosamente');
      return result;
    } catch (error: any) {
      console.log('[API] ⚠️ Backend no disponible, creando submission local');
      
      // Si falla el backend, crear submission local
      const result = await this.submitAssignment(submissionData);
      
      // Marcar como enviada también
      const key = `pdf_submitted_${assignmentId}_${studentId}`;
      localStorage.setItem(key, JSON.stringify({ submitted: true, submittedAt: new Date().toISOString() }));
      console.log('[API] ✅ Tarea PDF enviada con submission creada (fallback)');
      return { success: true, message: 'Tarea enviada (modo local)', submission: result.submission };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // NOTIFICACIONES
  // ═══════════════════════════════════════════════════════════════════

  async getNotifications() {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.getNotifications();
    }

    try {
      const response = await this.request('/notifications');
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.getNotifications();
      }
      throw error;
    }
  }

  async createNotification(userId: string, role: string, notification: any) {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.createNotification(userId, role, notification);
    }

    try {
      const response = await this.request('/notifications', {
        method: 'POST',
        body: JSON.stringify({ userId, role, notification }),
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.createNotification(userId, role, notification);
      }
      throw error;
    }
  }

  async markNotificationsAsRead(notificationIds: string[]) {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.markNotificationsAsRead(notificationIds);
    }

    try {
      const response = await this.request('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ notificationIds }),
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.markNotificationsAsRead(notificationIds);
      }
      throw error;
    }
  }

  async markAllNotificationsAsRead() {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.markAllNotificationsAsRead();
    }

    try {
      const response = await this.request('/notifications/mark-all-read', {
        method: 'POST',
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.markAllNotificationsAsRead();
      }
      throw error;
    }
  }

  async deleteNotification(notificationId: string) {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.deleteNotification(notificationId);
    }

    try {
      const response = await this.request(`/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.deleteNotification(notificationId);
      }
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PDF VERSIONING & COLLABORATIVE EDITING
  // ═══════════════════════════════════════════════════════════════════

  async getPDFVersions(assignmentId: string, studentId: string) {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.getPDFVersions(assignmentId, studentId);
    }

    try {
      const response = await this.request(`/pdf-versions/${assignmentId}/${studentId}`);
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.getPDFVersions(assignmentId, studentId);
      }
      throw error;
    }
  }

  async createPDFVersion(data: {
    assignmentId: string;
    studentId: string;
    version: string;
    annotations: any[];
    status: string;
  }) {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.createPDFVersion(data);
    }

    try {
      const response = await this.request('/pdf-versions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.createPDFVersion(data);
      }
      throw error;
    }
  }

  async updatePDFVersion(versionId: string, data: {
    annotations?: any[];
    status?: string;
  }) {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.updatePDFVersion(versionId, data);
    }

    try {
      const response = await this.request(`/pdf-versions/${versionId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.updatePDFVersion(versionId, data);
      }
      throw error;
    }
  }

  async getPDFWorkflowStatus(assignmentId: string, studentId: string) {
    if (isDemoMode() || this.useDemoMode) {
      return demoModeAPI.getPDFWorkflowStatus(assignmentId, studentId);
    }

    try {
      const response = await this.request(`/pdf-workflow/${assignmentId}/${studentId}`);
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'DEMO_MODE') {
        return demoModeAPI.getPDFWorkflowStatus(assignmentId, studentId);
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();