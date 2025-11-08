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

  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(`educonnect_demo_${key}`, JSON.stringify(value));
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

      this.setItem('users', users);
      this.setItem('assignments', assignments);
      this.setItem('submissions', []);
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
    this.setItem('submissions', submissions);
  }

  updateSubmission(id: string, updates: Partial<Submission>): void {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex(s => s.id === id);
    if (index !== -1) {
      submissions[index] = { ...submissions[index], ...updates };
      this.setItem('submissions', submissions);
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
}

const storage = new DemoModeStorage();

// API Mock - Simula todas las llamadas al backend
export class DemoModeAPI {
  private currentUserId: string | null = null;

  constructor() {
    storage.initialize();
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  getCurrentUserId(): string {
    if (!this.currentUserId) throw new Error('No user logged in');
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

    this.currentUserId = user.id;
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
    this.currentUserId = user.id;
    return { user };
  }

  async getCurrentUser(): Promise<{ user: User }> {
    await this.delay(30); // Reduced for faster response
    const user = storage.getUser(this.getCurrentUserId());
    if (!user) throw new Error('Usuario no encontrado');
    return { user };
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
    const assignment: Assignment = {
      id: `demo-assignment-${Date.now()}`,
      ...data,
      teacherId: this.getCurrentUserId(),
      createdAt: new Date().toISOString(),
      assignedStudents: [],
    };
    storage.addAssignment(assignment);
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
    const submission: Submission = {
      id: `demo-submission-${Date.now()}`,
      ...data,
      studentId: this.getCurrentUserId(),
      submittedAt: new Date().toISOString(),
    };
    storage.addSubmission(submission);
    return { submission };
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<{ submissions: any[] }> {
    await this.delay(30); // Reduced for faster response
    const submissions = storage.getSubmissions().filter(s => s.assignmentId === assignmentId);
    
    // Enrich with student data
    const enriched = submissions.map(sub => {
      const student = storage.getUser(sub.studentId);
      return {
        ...sub,
        studentName: student?.name || 'Unknown',
        studentEmail: student?.email || 'unknown@demo.com',
      };
    });
    
    return { submissions: enriched };
  }

  async getMySubmissions(): Promise<{ submissions: any[] }> {
    await this.delay(30); // Reduced for faster response
    const studentId = this.getCurrentUserId();
    const submissions = storage.getSubmissions().filter(s => s.studentId === studentId);
    
    // Enrich with assignment data
    const enriched = submissions.map(sub => {
      const assignment = storage.getAssignment(sub.assignmentId);
      return {
        ...sub,
        assignmentTitle: assignment?.title || 'Unknown',
      };
    });
    
    return { submissions: enriched };
  }

  async gradeSubmission(submissionId: string, data: { grade: number; feedback: string }): Promise<void> {
    await this.delay(50); // Reduced for faster response
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

  // File upload (mock)
  async uploadFile(file: File): Promise<{ url: string }> {
    await this.delay(200); // Reduced for faster response (was 1000ms)
    // In demo mode, we can't actually upload files
    // Return a placeholder URL
    return { url: `demo://file/${file.name}` };
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
