import { projectId, publicAnonKey } from './supabase/info';
import { demoModeAPI, enableDemoMode, isDemoMode } from './demo-mode';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-05c2b65f`;

export class ApiClient {
  private token: string | null = null;
  private useDemoMode = false;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

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
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // If 403 or 404, enable demo mode
        if (response.status === 403 || response.status === 404) {
          console.log('[EduConnect] Backend unavailable, enabling demo mode');
          enableDemoMode();
          this.useDemoMode = true;
          throw new Error('DEMO_MODE');
        }
        
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `Request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      // Network errors also trigger demo mode
      if (error.message === 'DEMO_MODE') {
        throw error;
      }
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        console.log('[EduConnect] Network error, enabling demo mode');
        enableDemoMode();
        this.useDemoMode = true;
        throw new Error('DEMO_MODE');
      }
      throw error;
    }
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

  async signup(data: { email: string; password: string; name: string; role: 'teacher' | 'student' }) {
    return this.handleDemoMode(
      () => this.request('/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      () => demoModeAPI.signup(data)
    );
  }

  async getCurrentUser() {
    return this.handleDemoMode(
      () => this.request('/user'),
      () => demoModeAPI.getCurrentUser()
    );
  }

  async createAssignment(data: any) {
    return this.handleDemoMode(
      () => this.request('/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      () => demoModeAPI.createAssignment(data)
    );
  }

  async getAssignments() {
    return this.handleDemoMode(
      () => this.request('/assignments'),
      () => demoModeAPI.getAssignments()
    );
  }

  async getAssignment(id: string) {
    return this.handleDemoMode(
      () => this.request(`/assignments/${id}`),
      () => demoModeAPI.getAssignment(id)
    );
  }

  async updateAssignment(id: string, data: any) {
    return this.handleDemoMode(
      () => this.request(`/assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      () => demoModeAPI.updateAssignment(id, data)
    );
  }

  async deleteAssignment(id: string) {
    return this.handleDemoMode(
      () => this.request(`/assignments/${id}`, {
        method: 'DELETE',
      }),
      async () => {
        await demoModeAPI.deleteAssignment(id);
        return {};
      }
    );
  }

  async submitAssignment(data: any) {
    return this.handleDemoMode(
      () => this.request('/submissions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      () => demoModeAPI.submitAssignment(data)
    );
  }

  async getAssignmentSubmissions(assignmentId: string) {
    return this.handleDemoMode(
      () => this.request(`/assignments/${assignmentId}/submissions`),
      () => demoModeAPI.getAssignmentSubmissions(assignmentId)
    );
  }

  async gradeSubmission(submissionId: string, data: { grade: number; feedback: string }) {
    return this.handleDemoMode(
      () => this.request(`/submissions/${submissionId}/grade`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      async () => {
        await demoModeAPI.gradeSubmission(submissionId, data);
        return {};
      }
    );
  }

  async getMySubmissions() {
    return this.handleDemoMode(
      () => this.request('/my-submissions'),
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
      const response = await fetch(`${BASE_URL}/upload`, {
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
      () => this.request('/students'),
      () => demoModeAPI.getStudents()
    );
  }

  async assignStudent(studentId: string, assign: boolean) {
    return this.handleDemoMode(
      () => this.request('/assign-student', {
        method: 'POST',
        body: JSON.stringify({ studentId, assign }),
      }),
      async () => {
        // Not used in current implementation
        return {};
      }
    );
  }

  async getMyStudents() {
    return this.handleDemoMode(
      () => this.request('/my-students'),
      () => demoModeAPI.getMyStudents()
    );
  }

  async assignTask(assignmentId: string, studentIds: string[]) {
    return this.handleDemoMode(
      () => this.request('/assign-task', {
        method: 'POST',
        body: JSON.stringify({ assignmentId, studentIds }),
      }),
      async () => {
        await demoModeAPI.assignTask(assignmentId, studentIds);
        return {};
      }
    );
  }

  async getAssignedStudents(assignmentId: string) {
    return this.handleDemoMode(
      () => this.request(`/assignments/${assignmentId}/assigned-students`),
      () => demoModeAPI.getAssignedStudents(assignmentId)
    );
  }

  // Admin methods
  async getAllUsers() {
    return this.handleDemoMode(
      () => this.request('/admin/users'),
      () => demoModeAPI.getAllUsers()
    );
  }

  async assignTeacherToStudent(teacherId: string, studentId: string) {
    return this.handleDemoMode(
      () => this.request('/admin/assign-teacher', {
        method: 'POST',
        body: JSON.stringify({ teacherId, studentId }),
      }),
      async () => {
        await demoModeAPI.assignTeacherToStudent(teacherId, studentId);
        return {};
      }
    );
  }

  async unassignTeacherFromStudent(teacherId: string, studentId: string) {
    return this.handleDemoMode(
      () => this.request('/admin/unassign-teacher', {
        method: 'POST',
        body: JSON.stringify({ teacherId, studentId }),
      }),
      async () => {
        await demoModeAPI.unassignTeacherFromStudent(teacherId, studentId);
        return {};
      }
    );
  }

  async deleteUser(userId: string) {
    return this.handleDemoMode(
      () => this.request(`/admin/users/${userId}`, {
        method: 'DELETE',
      }),
      async () => {
        await demoModeAPI.deleteUser(userId);
        return {};
      }
    );
  }

  async blockUser(userId: string, blocked: boolean) {
    return this.handleDemoMode(
      () => this.request(`/admin/users/${userId}/block`, {
        method: 'POST',
        body: JSON.stringify({ blocked }),
      }),
      async () => {
        await demoModeAPI.blockUser(userId, blocked);
        return {};
      }
    );
  }

  async updateUserProfile(updates: any) {
    return this.handleDemoMode(
      () => this.request('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
      () => demoModeAPI.updateUserProfile(updates)
    );
  }

  // Notes/Materials methods
  async createNote(data: any) {
    return this.handleDemoMode(
      () => this.request('/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      () => demoModeAPI.createNote(data)
    );
  }

  async getNotes() {
    return this.handleDemoMode(
      () => this.request('/notes'),
      () => demoModeAPI.getNotes()
    );
  }

  async deleteNote(id: string) {
    return this.handleDemoMode(
      () => this.request(`/notes/${id}`, {
        method: 'DELETE',
      }),
      async () => {
        await demoModeAPI.deleteNote(id);
        return {};
      }
    );
  }

  async assignNote(noteId: string, studentIds: string[]) {
    return this.handleDemoMode(
      () => this.request('/assign-note', {
        method: 'POST',
        body: JSON.stringify({ noteId, studentIds }),
      }),
      async () => {
        await demoModeAPI.assignNote(noteId, studentIds);
        return {};
      }
    );
  }

  async getAssignedStudentsForNote(noteId: string) {
    return this.handleDemoMode(
      () => this.request(`/notes/${noteId}/assigned-students`),
      () => demoModeAPI.getAssignedStudentsForNote(noteId)
    );
  }

  async markNoteAsRead(noteId: string) {
    return this.handleDemoMode(
      () => this.request(`/notes/${noteId}/mark-read`, {
        method: 'POST',
      }),
      async () => {
        await demoModeAPI.markNoteAsRead(noteId);
        return {};
      }
    );
  }

  async markNoteAsOpened(noteId: string) {
    return this.handleDemoMode(
      () => this.request(`/notes/${noteId}/mark-opened`, {
        method: 'POST',
      }),
      async () => {
        await demoModeAPI.markNoteAsOpened(noteId);
        return {};
      }
    );
  }

  // AI Task Creation methods (Not available in demo mode)
  async generateTaskWithAI(contentData: any) {
    if (isDemoMode() || this.useDemoMode) {
      throw new Error('La generación AI no está disponible en modo demo. El servidor no está disponible o no respondió a tiempo.');
    }
    
    try {
      return await this.request('/ai/generate-task', {
        method: 'POST',
        body: JSON.stringify(contentData),
      });
    } catch (error: any) {
      // Provide more context about the error
      if (error.message && error.message.includes('OpenAI')) {
        throw new Error(`Error de la API de OpenAI: ${error.message}`);
      }
      throw error;
    }
  }

  async generateTaskPDF(task: any) {
    if (isDemoMode() || this.useDemoMode) {
      throw new Error('La generación de PDF no está disponible en modo demo. El servidor no está disponible o no respondió a tiempo.');
    }
    return this.request('/ai/generate-task-pdf', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  // PDF Annotation methods (Not available in demo mode)
  async getPDFAnnotations(assignmentId: string) {
    if (isDemoMode() || this.useDemoMode) {
      return { annotations: [] };
    }
    return this.request(`/pdf-annotations/${assignmentId}`);
  }

  async savePDFAnnotations(assignmentId: string, annotations: any[]) {
    if (isDemoMode() || this.useDemoMode) {
      return {};
    }
    return this.request(`/pdf-annotations/${assignmentId}`, {
      method: 'POST',
      body: JSON.stringify({ annotations }),
    });
  }

  async submitPDFAssignment(assignmentId: string) {
    if (isDemoMode() || this.useDemoMode) {
      throw new Error('La entrega de PDF no está disponible en modo demo');
    }
    return this.request(`/pdf-submit/${assignmentId}`, {
      method: 'POST',
    });
  }

  async getFlattenedPDF(submissionId: string) {
    if (isDemoMode() || this.useDemoMode) {
      throw new Error('La descarga de PDF no está disponible en modo demo');
    }
    return this.request(`/pdf-flattened/${submissionId}`);
  }
}

export const apiClient = new ApiClient();
