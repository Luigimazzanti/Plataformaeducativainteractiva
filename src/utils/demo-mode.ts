// DEMO MODE - Sistema completo sin backend para pruebas
// Este modo se activa automáticamente cuando el Edge Function no está disponible

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
  blocked?: boolean;
  teacherIds?: string[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
  createdAt: string;
  fileUrl?: string;
  formFields?: any[];
  type?: 'file' | 'form' | 'pdf';
  assignedStudents?: string[];
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  fileUrl?: string;
  formData?: any;
  grade?: number;
  feedback?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  content?: any;
  reviewedAt?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  teacherId: string;
  createdAt: string;
  fileUrl?: string;
  videoUrl?: string;
  assignedStudents?: string[];
  readBy?: string[];
  openedBy?: string[];
}

class DemoModeStorage {
  private getItem<T>(key: string, defaultValue: T): T {
    const item = localStorage.getItem(`educonnect_demo_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setItem(key: string, value: any) {
    localStorage.setItem(`educonnect_demo_${key}`, JSON.stringify(value));
  }

  // 🆕 FUNCIÓN PARA LIMPIAR ESPACIO EN LOCALSTORAGE CUANDO SE LLENA
  private cleanupOldData() {
    console.log('🧹 [Storage] Limpiando datos antiguos para liberar espacio...');
    
    try {
      // 1. LIMPIAR TODAS LAS ANOTACIONES PDF (son enormes en base64)
      const pdfKeysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('pdf_annotations_') || 
            key?.startsWith('annotated_pdf_') || 
            key?.startsWith('pdf_versions:')) {
          pdfKeysToRemove.push(key);
        }
      }
      
      if (pdfKeysToRemove.length > 0) {
        console.log(`🧹 [Storage] Limpiando ${pdfKeysToRemove.length} archivos PDF del localStorage`);
        pdfKeysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // 2. Mantener SOLO las últimas 10 submissions (eliminar las antiguas)
      const submissions = this.getSubmissions();
      
      // Ordenar por fecha de entrega (más recientes primero)
      const sortedSubmissions = submissions.sort((a: Submission, b: Submission) => {
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        return dateB - dateA; // Más reciente primero
      });
      
      // Mantener solo las últimas 10
      const recentSubmissions = sortedSubmissions.slice(0, 10);
      
      const removedCount = submissions.length - recentSubmissions.length;
      if (removedCount > 0) {
        console.log(`🧹 [Storage] Eliminadas ${removedCount} entregas antiguas (solo se mantienen las últimas 10)`);
        
        // IMPORTANTE: Usar setItem directamente aquí, NO setItemSafe (evitar loop infinito)
        this.setItem('submissions', recentSubmissions);
      }
      
      // 3. Eliminar archivos grandes de las submissions (PDFs en base64)
      const cleanedSubmissions = recentSubmissions.map((sub: any) => {
        if (sub.files && Array.isArray(sub.files)) {
          // Eliminar PDFs en base64 de las submissions, solo mantener metadatos
          const cleanedFiles = sub.files.map((file: any) => {
            if (file.url && file.url.length > 10000) {
              // Si el URL es muy largo (base64), eliminarlo
              console.log(`🧹 [Storage] Eliminando PDF grande de submission ${sub.id}`);
              return {
                name: file.name,
                type: file.type,
                size: file.size,
                url: '[PDF_REMOVED_TO_SAVE_SPACE]' // Marcador
              };
            }
            return file;
          });
          return { ...sub, files: cleanedFiles };
        }
        return sub;
      });
      
      // Guardar submissions limpias
      this.setItem('submissions', cleanedSubmissions);
      console.log('✅ [Storage] Limpieza completada');
      
      return true;
    } catch (error) {
      console.error('❌ [Storage] Error limpiando datos:', error);
      return false;
    }
  }

  // 🔧 MODIFICAR setItem para manejar errores de cuota automáticamente
  private setItemSafe(key: string, value: any): boolean {
    try {
      localStorage.setItem(`educonnect_demo_${key}`, JSON.stringify(value));
      return true;
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ [Storage] Cuota excedida, limpiando espacio...');
        this.cleanupOldData();
        
        // Intentar de nuevo después de limpiar
        try {
          localStorage.setItem(`educonnect_demo_${key}`, JSON.stringify(value));
          console.log('✅ [Storage] Guardado exitoso después de limpieza');
          return true;
        } catch (retryError) {
          console.error('❌ [Storage] Error persistente después de limpieza');
          throw retryError;
        }
      } else {
        throw error;
      }
    }
  }

  // Reset demo data - for development/testing
  reset() {
    localStorage.removeItem('educonnect_demo_initialized');
    this.initialize();
  }

  // Initialize demo data
  initialize() {
    if (!localStorage.getItem('educonnect_demo_initialized')) {
      const users: User[] = [
        {
          id: 'demo-teacher-1',
          email: 'teacher@demo.com',
          name: 'Profesor Demo',
          role: 'teacher',
        },
        {
          id: 'demo-student-1',
          email: 'student@demo.com',
          name: 'Estudiante Demo',
          role: 'student',
          teacherIds: ['demo-teacher-1'],
        },
        {
          id: 'demo-student-2',
          email: 'student2@demo.com',
          name: 'Ana García',
          role: 'student',
          teacherIds: ['demo-teacher-1'],
        },
      ];

      const assignments: Assignment[] = [
        {
          id: 'demo-assignment-1',
          title: 'Matemáticas - Álgebra Básica',
          description: 'Resolver ejercicios del capítulo 3',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          teacherId: 'demo-teacher-1',
          createdAt: new Date().toISOString(),
          type: 'file',
          assignedStudents: ['demo-student-1', 'demo-student-2'],
        },
      ];

      const notes: Note[] = [
        {
          id: 'demo-note-1',
          title: 'Bienvenida al Curso',
          content: 'Material de introducción al curso',
          teacherId: 'demo-teacher-1',
          createdAt: new Date().toISOString(),
          assignedStudents: ['demo-student-1', 'demo-student-2'],
          readBy: [],
          openedBy: [],
        },
      ];

      const submissions: Submission[] = [
        {
          id: 'demo-submission-1',
          assignmentId: 'demo-assignment-1',
          studentId: 'demo-student-1',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'SUBMITTED',
          content: {
            textResponse: 'He completado todos los ejercicios del capítulo 3.',
          },
        },
        {
          id: 'demo-submission-2',
          assignmentId: 'demo-assignment-1',
          studentId: 'demo-student-2',
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'GRADED',
          grade: 95,
          feedback: 'Excelente trabajo, sigue así!',
          reviewedAt: new Date().toISOString(),
          content: {
            textResponse: 'Ejercicios completados correctamente.',
          },
        },
      ];

      this.setItem('users', users);
      this.setItem('assignments', assignments);
      this.setItem('submissions', submissions);
      this.setItem('notes', notes);
      localStorage.setItem('educonnect_demo_initialized', 'true');
    }
  }

  // User methods
  getUsers(): User[] {
    return this.getItem('users', []);
  }

  getUser(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email === email);
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.setItem('users', users);
  }

  updateUser(id: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.setItem('users', users);
    }
  }

  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    this.setItem('users', users);
  }

  // Assignment methods
  getAssignments(): Assignment[] {
    return this.getItem('assignments', []);
  }

  getAssignment(id: string): Assignment | undefined {
    return this.getAssignments().find(a => a.id === id);
  }

  addAssignment(assignment: Assignment): void {
    const assignments = this.getAssignments();
    assignments.push(assignment);
    this.setItem('assignments', assignments);
  }

  updateAssignment(id: string, updates: Partial<Assignment>): void {
    const assignments = this.getAssignments();
    const index = assignments.findIndex(a => a.id === id);
    if (index !== -1) {
      assignments[index] = { ...assignments[index], ...updates };
      this.setItem('assignments', assignments);
    }
  }

  deleteAssignment(id: string): void {
    const assignments = this.getAssignments().filter(a => a.id !== id);
    this.setItem('assignments', assignments);
  }

  // Submission methods
  getSubmissions(): Submission[] {
    return this.getItem('submissions', []);
  }

  getSubmission(id: string): Submission | undefined {
    return this.getSubmissions().find(s => s.id === id);
  }

  addSubmission(submission: Submission): void {
    const submissions = this.getSubmissions();
    submissions.push(submission);
    this.setItemSafe('submissions', submissions); // 🔧 Usar setItemSafe para auto-limpiar si está lleno
    
    // Disparar evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('submission-added', { 
      detail: submission 
    }));
  }

  updateSubmission(id: string, updates: Partial<Submission>): void {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex(s => s.id === id);
    if (index !== -1) {
      submissions[index] = { ...submissions[index], ...updates };
      this.setItemSafe('submissions', submissions); // 🔧 Usar setItemSafe
    }
  }

  // Note methods
  getNotes(): Note[] {
    return this.getItem('notes', []);
  }

  getNote(id: string): Note | undefined {
    return this.getNotes().find(n => n.id === id);
  }

  addNote(note: Note): void {
    const notes = this.getNotes();
    notes.push(note);
    this.setItem('notes', notes);
  }

  updateNote(id: string, updates: Partial<Note>): void {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updates };
      this.setItem('notes', notes);
    }
  }

  deleteNote(id: string): void {
    const notes = this.getNotes().filter(n => n.id !== id);
    this.setItem('notes', notes);
  }

  // Notification methods
  getNotifications(): any[] {
    return this.getItem('notifications', []);
  }

  addNotification(notification: any): void {
    const notifications = this.getNotifications();
    notifications.push(notification);
    this.setItem('notifications', notifications);
  }

  updateNotification(id: string, updates: any): void {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index] = { ...notifications[index], ...updates };
      this.setItem('notifications', notifications);
    }
  }

  deleteNotification(id: string): void {
    const notifications = this.getNotifications().filter(n => n.id !== id);
    this.setItem('notifications', notifications);
  }
}

const storage = new DemoModeStorage();

// API Mock - Simula todas las llamadas al backend
export class DemoModeAPI {
  private currentUserId: string | null = null;

  constructor() {
    storage.initialize();
    // Restaurar currentUserId desde localStorage si existe
    this.restoreCurrentUser();
  }

  private restoreCurrentUser() {
    const savedUserId = localStorage.getItem('educonnect_user_id');
    if (savedUserId) {
      this.currentUserId = savedUserId;
      console.log('[DemoMode] ✅ Restaurado currentUserId:', savedUserId);
    }
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
    // Persistir en localStorage para sobrevivir recargas de página
    localStorage.setItem('educonnect_user_id', userId);
    console.log('[DemoMode] ✅ Guardado currentUserId:', userId);
  }

  getCurrentUserId(): string {
    // Intentar restaurar si no existe
    if (!this.currentUserId) {
      this.restoreCurrentUser();
    }
    
    if (!this.currentUserId) {
      // Solo log en consola si es para debug, no es un error crítico
      console.log('[DemoMode] ℹ️ No user logged in (esperado antes de login)');
      throw new Error('No user logged in');
    }
    return this.currentUserId;
  }

  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await this.delay(50); // Reduced for faster login
    
    // Check demo credentials
    const demoCredentials: Record<string, string> = {
      'teacher@demo.com': 'demo123',
      'student@demo.com': 'demo123',
      'student2@demo.com': 'demo123',
    };

    if (demoCredentials[email] !== password) {
      throw new Error('Credenciales incorrectas');
    }

    const user = storage.getUserByEmail(email);
    if (!user) throw new Error('Usuario no encontrado');
    if (user.blocked) throw new Error('Usuario bloqueado');

    this.setCurrentUser(user.id);
    return { user, token: `demo_token_${user.id}` };
  }

  async signup(data: { email: string; password: string; name: string; role: 'teacher' | 'student' }): Promise<{ user: User }> {
    await this.delay(100); // Reduced for faster signup

    if (storage.getUserByEmail(data.email)) {
      throw new Error('El email ya está registrado');
    }

    const user: User = {
      id: `demo-${data.role}-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: data.role,
      teacherIds: [],
    };

    storage.addUser(user);
    this.setCurrentUser(user.id);
    return { user };
  }

  async getCurrentUser(): Promise<{ user: User }> {
    await this.delay(30); // Reduced for faster response
    const user = storage.getUser(this.getCurrentUserId());
    if (!user) throw new Error('Usuario no encontrado');
    return { user };
  }

  async logout(): Promise<void> {
    this.currentUserId = null;
    // La limpieza de localStorage se maneja en AuthManager.clearAll()
    console.log('[DemoMode] ✅ Sesión cerrada');
  }

  // Users
  async getAllUsers(): Promise<{ users: User[] }> {
    await this.delay(50); // Reduced for faster response
    return { users: storage.getUsers() };
  }

  async updateUserProfile(updates: Partial<User>): Promise<{ user: User }> {
    await this.delay(50); // Reduced for faster response
    const userId = this.getCurrentUserId();
    storage.updateUser(userId, updates);
    const user = storage.getUser(userId);
    if (!user) throw new Error('Usuario no encontrado');
    return { user };
  }

  async deleteUser(userId: string): Promise<void> {
    await this.delay(50); // Reduced for faster response
    storage.deleteUser(userId);
  }

  async blockUser(userId: string, blocked: boolean): Promise<void> {
    await this.delay(50); // Reduced for faster response
    storage.updateUser(userId, { blocked });
  }

  async updateUserMetadata(userId: string, metadata: { name?: string; role?: string; avatar?: string }): Promise<void> {
    await this.delay(50); // Reduced for faster response
    storage.updateUser(userId, metadata);
  }

  async assignTeacherToStudent(teacherId: string, studentId: string): Promise<void> {
    await this.delay(50); // Reduced for faster response
    const student = storage.getUser(studentId);
    if (student && student.role === 'student') {
      const teacherIds = student.teacherIds || [];
      if (!teacherIds.includes(teacherId)) {
        teacherIds.push(teacherId);
        storage.updateUser(studentId, { teacherIds });
      }
    }
  }

  async unassignTeacherFromStudent(teacherId: string, studentId: string): Promise<void> {
    await this.delay(30); // Reduced for faster response
    const student = storage.getUser(studentId);
    if (student && student.role === 'student') {
      const teacherIds = (student.teacherIds || []).filter(id => id !== teacherId);
      storage.updateUser(studentId, { teacherIds });
    }
  }

  // Students
  async getStudents(): Promise<{ students: User[] }> {
    await this.delay(30); // Reduced for faster response
    const users = storage.getUsers().filter(u => u.role === 'student');
    return { students: users };
  }

  async getMyStudents(): Promise<{ students: User[] }> {
    await this.delay(30); // Reduced for faster response
    const teacherId = this.getCurrentUserId();
    const students = storage.getUsers().filter(u => 
      u.role === 'student' && u.teacherIds?.includes(teacherId)
    );
    return { students };
  }

  // Assignments
  async createAssignment(data: any): Promise<{ assignment: Assignment }> {
    await this.delay(100); // Reduced for faster response
    const teacherId = this.getCurrentUserId();
    
    // 🔥 AUTO-ASIGNAR a todos los estudiantes del profesor
    const allStudents = storage.getUsers().filter(u => 
      u.role === 'student' && u.teacherIds?.includes(teacherId)
    );
    const studentIds = allStudents.map(s => s.id);
    
    const assignment: Assignment = {
      id: `demo-assignment-${Date.now()}`,
      ...data,
      teacherId,
      createdAt: new Date().toISOString(),
      assignedStudents: studentIds, // ✅ Asignada automáticamente
    };
    storage.addAssignment(assignment);
    
    console.log('✅ [DEMO] Tarea creada y asignada automáticamente a:', studentIds);
    
    return { assignment };
  }

  async getAssignments(): Promise<{ assignments: Assignment[] }> {
    await this.delay(30); // Reduced for faster response
    const userId = this.getCurrentUserId();
    const user = storage.getUser(userId);
    
    let assignments = storage.getAssignments();
    
    if (user?.role === 'teacher') {
      assignments = assignments.filter(a => a.teacherId === userId);
    } else if (user?.role === 'student') {
      assignments = assignments.filter(a => a.assignedStudents?.includes(userId));
    }
    
    return { assignments };
  }

  async getAssignment(id: string): Promise<{ assignment: Assignment }> {
    await this.delay(20); // Reduced for faster response
    const assignment = storage.getAssignment(id);
    if (!assignment) throw new Error('Tarea no encontrada');
    return { assignment };
  }

  async updateAssignment(id: string, data: any): Promise<{ assignment: Assignment }> {
    await this.delay(50); // Reduced for faster response
    storage.updateAssignment(id, data);
    const assignment = storage.getAssignment(id);
    if (!assignment) throw new Error('Tarea no encontrada');
    return { assignment };
  }

  async deleteAssignment(id: string): Promise<void> {
    await this.delay(50); // Reduced for faster response
    storage.deleteAssignment(id);
  }

  async assignTask(assignmentId: string, studentIds: string[]): Promise<void> {
    await this.delay(50); // Reduced for faster response
    const assignment = storage.getAssignment(assignmentId);
    if (assignment) {
      const currentStudents = assignment.assignedStudents || [];
      const updatedStudents = [...new Set([...currentStudents, ...studentIds])];
      storage.updateAssignment(assignmentId, { assignedStudents: updatedStudents });
    }
  }

  async getAssignedStudents(assignmentId: string): Promise<{ students: User[] }> {
    await this.delay(20); // Reduced for faster response
    const assignment = storage.getAssignment(assignmentId);
    if (!assignment) return { students: [] };
    
    const students = storage.getUsers().filter(u => 
      assignment.assignedStudents?.includes(u.id)
    );
    return { students };
  }

  // Submissions
  async submitAssignment(data: any): Promise<{ submission: Submission }> {
    await this.delay(100); // Reduced for faster response
    
    // 🔧 DEBUG: Ver qué archivos vienen en data.files
    console.log('[DemoMode] 📄 Creando submission con data:', {
      hasFiles: !!data.files,
      filesCount: data.files?.length || 0,
      files: data.files
    });
    
    // Obtener la tarea original para guardar una copia de sus datos
    const assignment = storage.getAssignment(data.assignmentId);
    
    // Obtener info del estudiante actual
    const studentId = this.getCurrentUserId();
    const student = storage.getUser(studentId);
    
    const submission: Submission = {
      id: `demo-submission-${Date.now()}`,
      ...data,
      studentId,
      submittedAt: new Date().toISOString(),
      status: 'SUBMITTED',
      // Guardar info del estudiante
      student: student ? {
        id: student.id,
        name: student.name,
        email: student.email
      } : undefined,
      studentName: student?.name,
      studentEmail: student?.email,
      // Guardar una copia de los datos de la tarea para mantener independencia
      assignmentTitle: assignment?.title || 'Tarea sin título',
      assignmentType: assignment?.type,
      assignmentDescription: assignment?.description,
      assignmentQuestions: assignment?.questions,
      assignmentFiles: assignment?.files,
      assignmentFormFields: assignment?.formFields,
      // 🔧 IMPORTANTE: Mantener los archivos del estudiante (PDF anotado)
      // ya viene en ...data, pero lo resaltamos aquí para claridad
      files: data.files || [] // PDF anotado del estudiante
    };
    
    // 🔧 DEBUG: Ver la submission final antes de guardar
    console.log('[DemoMode] 💾 Submission final antes de guardar:', {
      id: submission.id,
      hasFiles: !!submission.files,
      filesCount: submission.files?.length || 0,
      files: submission.files
    });
    
    storage.addSubmission(submission);
    
    // 🔔 Enviar notificación al profesor
    if (assignment?.teacherId) {
      console.log('[DemoMode] 🔔 Enviando notificación al profesor:', assignment.teacherId);
      const notification = {
        id: `notif-${Date.now()}`,
        userId: assignment.teacherId,
        type: 'submission' as const,
        title: '🎯 Nueva Entrega Recibida',
        message: `${student?.name || 'Un estudiante'} entregó "${assignment.title}"`,
        read: false,
        createdAt: new Date().toISOString(),
        assignmentId: assignment.id,
        submissionId: submission.id
      };
      storage.addNotification(notification);
      console.log('[DemoMode] ✅ Notificación creada:', notification);
    }
    
    // 🔔 Disparar evento para notificaciones en tiempo real
    console.log('[DemoMode] 🔔 Disparando evento submission-added:', submission);
    const event = new CustomEvent('submission-added', { 
      detail: { 
        assignmentId: data.assignmentId, 
        submissionId: submission.id,
        timestamp: new Date().toISOString()
      } 
    });
    window.dispatchEvent(event);
    
    return { submission };
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<{ submissions: any[] }> {
    await this.delay(30); // Reduced for faster response
    const submissions = storage.getSubmissions().filter(s => s.assignmentId === assignmentId);
    
    // Enrich with student data and assignment data (si no existe ya)
    const enriched = submissions.map(sub => {
      const student = storage.getUser(sub.studentId);
      
      // Si la submission no tiene los datos guardados, buscar la tarea
      if (!sub.assignmentTitle) {
        const assignment = storage.getAssignment(sub.assignmentId);
        return {
          ...sub,
          studentName: student?.name || 'Unknown',
          studentEmail: student?.email || 'unknown@demo.com',
          assignmentTitle: assignment?.title || 'Tarea sin título',
          assignmentType: assignment?.type,
        };
      }
      
      return {
        ...sub,
        studentName: student?.name || 'Unknown',
        studentEmail: student?.email || 'unknown@demo.com',
      };
    });
    
    return { submissions: enriched };
  }

  // 🚀 OPTIMIZACIÓN: Obtener TODAS las submissions de TODAS las tareas de una vez
  async getAllSubmissions(): Promise<{ submissions: any[] }> {
    await this.delay(20); // Muy rápido - solo una consulta
    const teacherId = this.getCurrentUserId();
    const allAssignments = storage.getAssignments().filter(a => a.createdBy === teacherId);
    const assignmentIds = allAssignments.map(a => a.id);
    
    // Obtener todas las submissions de las tareas del profesor
    const submissions = storage.getSubmissions().filter(s => 
      assignmentIds.includes(s.assignmentId)
    );
    
    // Enrich with student and assignment data
    const enriched = submissions.map(sub => {
      const student = storage.getUser(sub.studentId);
      const assignment = allAssignments.find(a => a.id === sub.assignmentId);
      
      return {
        ...sub,
        studentName: student?.name || 'Unknown',
        studentEmail: student?.email || 'unknown@demo.com',
        assignmentTitle: sub.assignmentTitle || assignment?.title || 'Tarea sin título',
        assignmentType: sub.assignmentType || assignment?.type,
      };
    });
    
    console.log('🚀 [DemoMode] getAllSubmissions:', {
      teacherId,
      assignmentCount: allAssignments.length,
      submissionCount: enriched.length
    });
    
    return { submissions: enriched };
  }

  async getMySubmissions(): Promise<{ submissions: any[] }> {
    await this.delay(30); // Reduced for faster response
    const studentId = this.getCurrentUserId();
    const submissions = storage.getSubmissions().filter(s => s.studentId === studentId);
    
    // Enrich with assignment data (solo si la submission no tiene ya el título guardado)
    const enriched = submissions.map(sub => {
      // Si la submission ya tiene los datos guardados, no buscar la tarea
      if (sub.assignmentTitle) {
        return sub;
      }
      
      // Para submissions antiguas, buscar la tarea y agregar el título
      const assignment = storage.getAssignment(sub.assignmentId);
      return {
        ...sub,
        assignmentTitle: assignment?.title || 'Tarea sin título',
      };
    });
    
    return { submissions: enriched };
  }

  async gradeSubmission(submissionId: string, data: { grade: number; feedback: string }): Promise<void> {
    await this.delay(50); // Reduced for faster response
    storage.updateSubmission(submissionId, data);
  }

  async getSubmissions(): Promise<any[]> {
    await this.delay(30);
    return storage.getSubmissions();
  }

  async updateSubmission(submissionId: string, data: any): Promise<void> {
    await this.delay(50);
    storage.updateSubmission(submissionId, data);
  }

  // Notes/Materials
  async createNote(data: any): Promise<{ note: Note }> {
    await this.delay(100); // Reduced for faster response
    const note: Note = {
      id: `demo-note-${Date.now()}`,
      ...data,
      teacherId: this.getCurrentUserId(),
      createdAt: new Date().toISOString(),
      assignedStudents: [],
      readBy: [],
      openedBy: [],
    };
    storage.addNote(note);
    return { note };
  }

  async getNotes(): Promise<{ notes: Note[] }> {
    await this.delay(30); // Reduced for faster response
    const userId = this.getCurrentUserId();
    const user = storage.getUser(userId);
    
    let notes = storage.getNotes();
    
    if (user?.role === 'teacher') {
      notes = notes.filter(n => n.teacherId === userId);
    } else if (user?.role === 'student') {
      notes = notes.filter(n => n.assignedStudents?.includes(userId));
    }
    
    return { notes };
  }

  async deleteNote(id: string): Promise<void> {
    await this.delay(50); // Reduced for faster response
    storage.deleteNote(id);
  }

  async assignNote(noteId: string, studentIds: string[]): Promise<void> {
    await this.delay(50); // Reduced for faster response
    const note = storage.getNote(noteId);
    if (note) {
      const currentStudents = note.assignedStudents || [];
      const updatedStudents = [...new Set([...currentStudents, ...studentIds])];
      storage.updateNote(noteId, { assignedStudents: updatedStudents });
    }
  }

  async getAssignedStudentsForNote(noteId: string): Promise<{ students: User[] }> {
    await this.delay(20); // Reduced for faster response
    const note = storage.getNote(noteId);
    if (!note) return { students: [] };
    
    const students = storage.getUsers().filter(u => 
      note.assignedStudents?.includes(u.id)
    );
    return { students };
  }

  async markNoteAsRead(noteId: string): Promise<void> {
    await this.delay(20); // Reduced for faster response
    const userId = this.getCurrentUserId();
    const note = storage.getNote(noteId);
    if (note) {
      const readBy = note.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        storage.updateNote(noteId, { readBy });
      }
    }
  }

  async markNoteAsOpened(noteId: string): Promise<void> {
    await this.delay(20); // Reduced for faster response
    const userId = this.getCurrentUserId();
    const note = storage.getNote(noteId);
    if (note) {
      const openedBy = note.openedBy || [];
      if (!openedBy.includes(userId)) {
        openedBy.push(userId);
        storage.updateNote(noteId, { openedBy });
      }
    }
  }

  // File upload (mock) - returns same format as real API
  async uploadFile(file: File): Promise<{ name: string; type: string; size: number; url: string }> {
    await this.delay(200); // Simulate upload time
    
    // In demo mode, convert to Data URL for immediate use
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          url: dataUrl,
        });
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file in demo mode'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Notificaciones
  async getNotifications(): Promise<{ notifications: any[] }> {
    await this.delay(30);
    const userId = this.getCurrentUserId();
    const user = storage.getUser(userId);
    const role = user?.role || 'student';
    
    const key = `notifications:${userId}:${role}`;
    const stored = localStorage.getItem(key);
    const notifications = stored ? JSON.parse(stored) : [];
    
    // Ordenar por fecha (más recientes primero)
    const sorted = notifications.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return { notifications: sorted };
  }

  async createNotification(userId: string, role: string, notification: any): Promise<{ success: boolean; notification: any }> {
    await this.delay(50);
    
    const key = `notifications:${userId}:${role}`;
    const stored = localStorage.getItem(key);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const newNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false,
      is_read: false,
    };
    
    notifications.unshift(newNotification);
    
    // Mantener solo las últimas 50 notificaciones
    const trimmed = notifications.slice(0, 50);
    
    localStorage.setItem(key, JSON.stringify(trimmed));
    
    return { success: true, notification: newNotification };
  }

  async markNotificationsAsRead(notificationIds: string[]): Promise<{ success: boolean; updatedCount: number }> {
    await this.delay(50);
    
    const userId = this.getCurrentUserId();
    const user = storage.getUser(userId);
    const role = user?.role || 'student';
    const key = `notifications:${userId}:${role}`;
    
    const stored = localStorage.getItem(key);
    if (!stored) {
      return { success: true, updatedCount: 0 };
    }
    
    const notifications = JSON.parse(stored);
    let updatedCount = 0;
    
    const updated = notifications.map((n: any) => {
      if (notificationIds.includes(n.id) && !n.read) {
        updatedCount++;
        return { ...n, read: true, is_read: true };
      }
      return n;
    });
    
    localStorage.setItem(key, JSON.stringify(updated));
    
    return { success: true, updatedCount };
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean; updatedCount: number }> {
    await this.delay(50);
    
    const userId = this.getCurrentUserId();
    const user = storage.getUser(userId);
    const role = user?.role || 'student';
    const key = `notifications:${userId}:${role}`;
    
    const stored = localStorage.getItem(key);
    if (!stored) {
      return { success: true, updatedCount: 0 };
    }
    
    const notifications = JSON.parse(stored);
    let updatedCount = 0;
    
    const updated = notifications.map((n: any) => {
      if (!n.read) {
        updatedCount++;
        return { ...n, read: true, is_read: true };
      }
      return n;
    });
    
    localStorage.setItem(key, JSON.stringify(updated));
    
    return { success: true, updatedCount };
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    await this.delay(50);
    
    const userId = this.getCurrentUserId();
    const user = storage.getUser(userId);
    const role = user?.role || 'student';
    const key = `notifications:${userId}:${role}`;
    
    const stored = localStorage.getItem(key);
    if (!stored) {
      return { success: true };
    }
    
    const notifications = JSON.parse(stored);
    const filtered = notifications.filter((n: any) => n.id !== notificationId);
    
    localStorage.setItem(key, JSON.stringify(filtered));
    
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PDF VERSIONING & COLLABORATIVE EDITING (DEMO MODE)
  // ═══════════════════════════════════════════════════════════════════

  async getPDFVersions(assignmentId: string, studentId: string): Promise<{ versions: any[]; status: string }> {
    await this.delay(100);
    
    const key = `pdf_versions:${assignmentId}:${studentId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      // Retornar versión original por defecto
      return {
        versions: [],
        status: 'not_started'
      };
    }
    
    const data = JSON.parse(stored);
    return data;
  }

  async createPDFVersion(data: {
    assignmentId: string;
    studentId: string;
    version: string;
    annotations: any[];
    status: string;
  }): Promise<{ success: boolean; versionId: string }> {
    await this.delay(100);
    
    const versionId = `pdf-ver-${Date.now()}`;
    const key = `pdf_versions:${data.assignmentId}:${data.studentId}`;
    
    // Cargar versiones existentes
    const existing = await this.getPDFVersions(data.assignmentId, data.studentId);
    
    const newVersion = {
      id: versionId,
      assignmentId: data.assignmentId,
      version: data.version,
      fileUrl: '', // En demo mode no se genera PDF real
      annotations: data.annotations,
      createdBy: this.getCurrentUserId(),
      createdByRole: storage.getUser(this.getCurrentUserId())?.role || 'student',
      createdAt: new Date().toISOString(),
      status: data.status,
    };
    
    const versions = [...existing.versions, newVersion];
    
    // Actualizar estado del workflow
    let workflowStatus = 'not_started';
    if (data.version === 'student' && data.status === 'submitted') {
      workflowStatus = 'student_submitted';
    } else if (data.version === 'teacher' && data.status === 'corrected') {
      workflowStatus = 'teacher_submitted';
    } else if (data.version === 'student') {
      workflowStatus = 'student_editing';
    } else if (data.version === 'teacher') {
      workflowStatus = 'teacher_correcting';
    }
    
    localStorage.setItem(key, JSON.stringify({
      versions,
      status: workflowStatus
    }));
    
    console.log('✅ [DemoMode] PDF version created:', newVersion);
    
    return { success: true, versionId };
  }

  async updatePDFVersion(versionId: string, data: {
    annotations?: any[];
    status?: string;
  }): Promise<{ success: boolean }> {
    await this.delay(100);
    
    // Buscar la versión en todas las combinaciones de assignment/student
    const keys = Object.keys(localStorage).filter(k => k.startsWith('pdf_versions:'));
    
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      
      const versionData = JSON.parse(stored);
      const versionIndex = versionData.versions.findIndex((v: any) => v.id === versionId);
      
      if (versionIndex !== -1) {
        // Actualizar la versión
        if (data.annotations) {
          versionData.versions[versionIndex].annotations = data.annotations;
        }
        if (data.status) {
          versionData.versions[versionIndex].status = data.status;
        }
        
        localStorage.setItem(key, JSON.stringify(versionData));
        console.log('✅ [DemoMode] PDF version updated:', versionId);
        return { success: true };
      }
    }
    
    return { success: false };
  }

  async getPDFWorkflowStatus(assignmentId: string, studentId: string): Promise<{ status: string }> {
    await this.delay(50);
    
    const key = `pdf_versions:${assignmentId}:${studentId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return { status: 'not_started' };
    }
    
    const data = JSON.parse(stored);
    return { status: data.status || 'not_started' };
  }

  // Utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const demoModeAPI = new DemoModeAPI();

// Demo mode is ONLY enabled when the backend is truly unavailable
// Demo credentials can be used without enabling demo mode if backend is available
export const isDemoMode = () => localStorage.getItem('educonnect_demo_mode') === 'true';
export const enableDemoMode = () => {
  console.log('[EduConnect] 🔴 ACTIVATING DEMO MODE - Backend unavailable');
  localStorage.setItem('educonnect_demo_mode', 'true');
};
export const disableDemoMode = () => {
  console.log('[EduConnect] 🟢 DISABLING DEMO MODE - Backend available');
  localStorage.removeItem('educonnect_demo_mode');
};

// Check if using demo credentials (not the same as demo mode)
export const isDemoCredentials = () => {
  const demoEmails = ['teacher@demo.com', 'student@demo.com', 'student2@demo.com'];
  const currentUserId = localStorage.getItem('educonnect_current_user');
  if (!currentUserId) return false;
  
  const users = new DemoModeStorage().getUsers();
  const user = users.find(u => u.id === currentUserId);
  return user ? demoEmails.includes(user.email) : false;
};

// Reset demo data - useful for development/testing
export const resetDemoData = () => {
  storage.reset();
  console.log('[EduConnect] ✅ Demo data has been reset');
};