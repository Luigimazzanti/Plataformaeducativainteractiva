// Sistema de notificaciones completo para estudiantes y profesores

export interface Notification {
  id: string;
  type: 'new_assignment' | 'new_grade' | 'new_feedback' | 'submission_received' | 'review_request';
  title: string;
  message: string;
  read: boolean;
  is_read?: boolean; // Campo del backend (Supabase)
  createdAt: string;
  created_at?: string; // Campo del backend (Supabase)
  read_at?: string; // Campo del backend (Supabase)
  // Metadata para navegación
  assignmentId?: string;
  submissionId?: string;
  studentId?: string;
  targetTab?: string; // Pestaña a la que navegar
  data?: any; // Datos adicionales del backend
}

export class NotificationManager {
  private static getStorageKey(userId: string): string {
    return `educonnect_viewed_feedback_${userId}`;
  }

  /**
   * Obtiene el conjunto de IDs de submissions que el usuario ya ha visto
   */
  static getViewedFeedback(userId: string): Set<string> {
    const storageKey = this.getStorageKey(userId);
    const stored = localStorage.getItem(storageKey);
    const result = stored ? new Set(JSON.parse(stored)) : new Set();
    // 🔇 SILENCIAR LOG (comentado)
    // console.log('🔔 [NotificationManager] Leyendo:', {
    //   userId,
    //   storageKey,
    //   stored,
    //   count: result.size,
    //   ids: [...result]
    // });
    return result;
  }

  /**
   * Marca una submission como vista
   */
  static markAsViewed(userId: string, submissionId: string): void {
    const storageKey = this.getStorageKey(userId);
    const viewedFeedback = this.getViewedFeedback(userId);
    viewedFeedback.add(submissionId);
    const viewed = [...viewedFeedback];
    localStorage.setItem(storageKey, JSON.stringify(viewed));
    console.log('🔔 [NotificationManager] Guardado:', {
      userId,
      submissionId,
      storageKey,
      viewed,
      localStorage_value: localStorage.getItem(storageKey)
    });
  }

  /**
   * Verifica si una submission tiene feedback nuevo (no visto)
   */
  static hasNewFeedback(
    userId: string,
    submissionId: string,
    hasFeedback: boolean
  ): boolean {
    if (!hasFeedback) return false;
    const viewedFeedback = this.getViewedFeedback(userId);
    return !viewedFeedback.has(submissionId);
  }

  /**
   * Cuenta cuántas submissions tienen feedback nuevo
   */
  static getNewFeedbackCount(userId: string, submissions: any[]): number {
    const viewedFeedback = this.getViewedFeedback(userId);
    const withFeedback = submissions.filter(sub => 
      sub.feedback || (sub.grade !== null && sub.grade !== undefined)
    );
    const newFeedback = withFeedback.filter(sub => !viewedFeedback.has(sub.id));
    
    // 🔇 SILENCIAR LOG (comentado)
    // console.log('🔔 [NotificationManager] Contador:', {
    //   userId,
    //   totalSubmissions: submissions.length,
    //   withFeedback: withFeedback.length,
    //   viewed: [...viewedFeedback],
    //   newCount: newFeedback.length,
    //   newIds: newFeedback.map(s => s.id)
    // });
    
    return newFeedback.length;
  }

  /**
   * Limpia todas las notificaciones vistas (útil para testing)
   */
  static clearAll(userId: string): void {
    localStorage.removeItem(this.getStorageKey(userId));
  }

  /**
   * DEBUG: Muestra todo el localStorage relacionado con notificaciones
   */
  static debugLocalStorage(): void {
    console.log('🔔 [NotificationManager] 🐛 DEBUG COMPLETO:', {
      allKeys: Object.keys(localStorage),
      feedbackKeys: Object.keys(localStorage).filter(k => k.includes('viewed_feedback')),
      values: Object.keys(localStorage)
        .filter(k => k.includes('viewed_feedback'))
        .map(k => ({ key: k, value: localStorage.getItem(k) }))
    });
  }

  // ============================================================
  // NOTIFICACIONES PARA PROFESORES (Entregas nuevas)
  // ============================================================

  private static TEACHER_SUBMISSIONS_KEY = 'educonnect_teacher_viewed_submissions';

  /**
   * Obtiene el conjunto de IDs de submissions que el profesor ya ha visto
   */
  static getViewedSubmissions(): Set<string> {
    const stored = localStorage.getItem(this.TEACHER_SUBMISSIONS_KEY);
    const result = stored ? new Set(JSON.parse(stored)) : new Set();
    console.log('📊 [NotificationManager] Entregas vistas (profesor):', {
      count: result.size,
      ids: Array.from(result)
    });
    return result;
  }

  /**
   * Marca una submission como vista por el profesor
   */
  static markSubmissionAsViewed(submissionId: string): void {
    const viewed = this.getViewedSubmissions();
    viewed.add(submissionId);
    const viewedArray = Array.from(viewed);
    localStorage.setItem(this.TEACHER_SUBMISSIONS_KEY, JSON.stringify(viewedArray));
    console.log('📊 [NotificationManager] Entrega marcada como vista:', {
      submissionId,
      totalViewed: viewedArray.length,
      stored: localStorage.getItem(this.TEACHER_SUBMISSIONS_KEY)
    });
  }

  /**
   * Limpia todas las entregas vistas por el profesor
   */
  static clearViewedSubmissions(): void {
    localStorage.removeItem(this.TEACHER_SUBMISSIONS_KEY);
    console.log('📊 [NotificationManager] Entregas vistas limpiadas');
  }

  // ============================================================
  // CENTRO DE NOTIFICACIONES (Estudiantes y Profesores)
  // ============================================================

  private static NOTIFICATIONS_KEY_STUDENT = 'educonnect_student_notifications';
  private static NOTIFICATIONS_KEY_TEACHER = 'educonnect_teacher_notifications';

  /**
   * Obtiene la key según el rol
   */
  private static getNotificationsKey(role: 'student' | 'teacher' | 'admin'): string {
    return role === 'student' ? this.NOTIFICATIONS_KEY_STUDENT : this.NOTIFICATIONS_KEY_TEACHER;
  }

  /**
   * Obtiene todas las notificaciones del usuario
   */
  static getNotifications(role: 'student' | 'teacher' | 'admin'): Notification[] {
    const key = this.getNotificationsKey(role);
    const stored = localStorage.getItem(key);
    const notifications = stored ? JSON.parse(stored) : [];
    
    // Ordenar por fecha (más recientes primero)
    return notifications.sort((a: Notification, b: Notification) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Agrega una nueva notificación
   */
  static addNotification(role: 'student' | 'teacher' | 'admin', notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void {
    const key = this.getNotificationsKey(role);
    const notifications = this.getNotifications(role);
    
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false
    };

    notifications.unshift(newNotification);
    
    // Mantener solo las últimas 50 notificaciones
    const trimmed = notifications.slice(0, 50);
    
    localStorage.setItem(key, JSON.stringify(trimmed));
    console.log('🔔 [NotificationManager] Notificación agregada:', newNotification);

    // Disparar evento
    const event = new CustomEvent('notification-added', { detail: newNotification });
    window.dispatchEvent(event);
  }

  /**
   * Marca una notificación como leída
   */
  static markAsRead(notificationId: string): void {
    // Buscar en ambas keys
    const keys = [this.NOTIFICATIONS_KEY_STUDENT, this.NOTIFICATIONS_KEY_TEACHER];
    
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      
      const notifications: Notification[] = JSON.parse(stored);
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      if (JSON.stringify(notifications) !== JSON.stringify(updated)) {
        localStorage.setItem(key, JSON.stringify(updated));
        console.log('🔔 [NotificationManager] Notificación marcada como leída:', notificationId);
        break;
      }
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  static markAllAsRead(role: 'student' | 'teacher' | 'admin'): void {
    const key = this.getNotificationsKey(role);
    const notifications = this.getNotifications(role);
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(key, JSON.stringify(updated));
    console.log('🔔 [NotificationManager] Todas las notificaciones marcadas como leídas');
  }

  /**
   * Elimina una notificación
   */
  static deleteNotification(notificationId: string): void {
    const keys = [this.NOTIFICATIONS_KEY_STUDENT, this.NOTIFICATIONS_KEY_TEACHER];
    
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      
      const notifications: Notification[] = JSON.parse(stored);
      const filtered = notifications.filter(n => n.id !== notificationId);
      
      if (notifications.length !== filtered.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        console.log('🔔 [NotificationManager] Notificación eliminada:', notificationId);
        break;
      }
    }
  }

  /**
   * Obtiene el número de notificaciones no leídas
   */
  static getUnreadCount(role: 'student' | 'teacher' | 'admin'): number {
    const notifications = this.getNotifications(role);
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Limpia todas las notificaciones
   */
  static clearAllNotifications(role: 'student' | 'teacher' | 'admin'): void {
    const key = this.getNotificationsKey(role);
    localStorage.removeItem(key);
    console.log('🔔 [NotificationManager] Todas las notificaciones eliminadas');
  }
}