import { apiClient } from './api';
import { NotificationManager } from './notifications';
import { realtimeNotificationService } from './realtime-notifications';

/**
 * ════════════════════════════════════════════════════════════════════════
 * HELPERS PARA CREAR NOTIFICACIONES AUTOMÁTICAS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * Funciones helper para crear notificaciones en eventos clave del sistema
 */

/**
 * Crea notificación cuando un estudiante entrega una tarea
 */
export async function notifyNewSubmission(params: {
  teacherId: string;
  studentName: string;
  assignmentTitle: string;
  assignmentId: string;
  submissionId: string;
}) {
  const { teacherId, studentName, assignmentTitle, assignmentId, submissionId } = params;

  const notification = {
    type: 'submission_received' as const,
    title: '📬 Nueva Entrega Recibida',
    message: `${studentName} entregó "${assignmentTitle}"`,
    assignmentId,
    submissionId,
    targetTab: 'grades',
  };

  try {
    // Intentar crear en backend
    await apiClient.createNotification(teacherId, 'teacher', notification);
    console.log('✅ [NotificationHelper] Notificación de entrega creada en backend');
  } catch (error) {
    // Fallback a localStorage
    console.log('⚠️ [NotificationHelper] Backend no disponible, usando localStorage');
    NotificationManager.addNotification('teacher', notification);
  }

  // Enviar via tiempo real si está conectado
  if (realtimeNotificationService.getConnectionStatus()) {
    await realtimeNotificationService.sendNotification(teacherId, {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

/**
 * Crea notificación cuando el profesor califica una entrega
 */
export async function notifyNewGrade(params: {
  studentId: string;
  assignmentTitle: string;
  grade: number;
  assignmentId: string;
  submissionId: string;
}) {
  const { studentId, assignmentTitle, grade, assignmentId, submissionId } = params;

  const notification = {
    type: 'new_grade' as const,
    title: '⭐ Nueva Calificación',
    message: `Tu tarea "${assignmentTitle}" fue calificada: ${grade}/100`,
    assignmentId,
    submissionId,
    targetTab: 'submissions',
  };

  try {
    await apiClient.createNotification(studentId, 'student', notification);
    console.log('✅ [NotificationHelper] Notificación de calificación creada en backend');
  } catch (error) {
    console.log('⚠️ [NotificationHelper] Backend no disponible, usando localStorage');
    NotificationManager.addNotification('student', notification);
  }

  if (realtimeNotificationService.getConnectionStatus()) {
    await realtimeNotificationService.sendNotification(studentId, {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

/**
 * Crea notificación cuando el profesor deja un comentario
 */
export async function notifyNewFeedback(params: {
  studentId: string;
  assignmentTitle: string;
  feedback: string;
  assignmentId: string;
  submissionId: string;
}) {
  const { studentId, assignmentTitle, feedback, assignmentId, submissionId } = params;

  const notification = {
    type: 'new_feedback' as const,
    title: '💬 Nuevo Comentario',
    message: `Recibiste un comentario en "${assignmentTitle}": ${feedback.substring(0, 50)}${feedback.length > 50 ? '...' : ''}`,
    assignmentId,
    submissionId,
    targetTab: 'submissions',
  };

  try {
    await apiClient.createNotification(studentId, 'student', notification);
    console.log('✅ [NotificationHelper] Notificación de comentario creada en backend');
  } catch (error) {
    console.log('⚠️ [NotificationHelper] Backend no disponible, usando localStorage');
    NotificationManager.addNotification('student', notification);
  }

  if (realtimeNotificationService.getConnectionStatus()) {
    await realtimeNotificationService.sendNotification(studentId, {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

/**
 * Crea notificación cuando se asigna una nueva tarea a un estudiante
 */
export async function notifyNewAssignment(params: {
  studentId: string;
  assignmentTitle: string;
  assignmentId: string;
  dueDate?: string;
}) {
  const { studentId, assignmentTitle, assignmentId, dueDate } = params;

  const dueDateText = dueDate 
    ? ` (Fecha límite: ${new Date(dueDate).toLocaleDateString('es-ES')})`
    : '';

  const notification = {
    type: 'new_assignment' as const,
    title: '📚 Nueva Tarea Asignada',
    message: `Se te asignó la tarea "${assignmentTitle}"${dueDateText}`,
    assignmentId,
    targetTab: 'assignments',
  };

  try {
    await apiClient.createNotification(studentId, 'student', notification);
    console.log('✅ [NotificationHelper] Notificación de nueva tarea creada en backend');
  } catch (error) {
    console.log('⚠️ [NotificationHelper] Backend no disponible, usando localStorage');
    NotificationManager.addNotification('student', notification);
  }

  if (realtimeNotificationService.getConnectionStatus()) {
    await realtimeNotificationService.sendNotification(studentId, {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

/**
 * Crea notificación de recordatorio de fecha límite (para ejecutar con cron/scheduler)
 */
export async function notifyDeadlineReminder(params: {
  studentId: string;
  assignmentTitle: string;
  assignmentId: string;
  hoursRemaining: number;
}) {
  const { studentId, assignmentTitle, assignmentId, hoursRemaining } = params;

  const notification = {
    type: 'review_request' as const,
    title: '⏰ Recordatorio de Fecha Límite',
    message: `La tarea "${assignmentTitle}" vence en ${hoursRemaining} horas`,
    assignmentId,
    targetTab: 'assignments',
  };

  try {
    await apiClient.createNotification(studentId, 'student', notification);
    console.log('✅ [NotificationHelper] Notificación de recordatorio creada en backend');
  } catch (error) {
    console.log('⚠️ [NotificationHelper] Backend no disponible, usando localStorage');
    NotificationManager.addNotification('student', notification);
  }

  if (realtimeNotificationService.getConnectionStatus()) {
    await realtimeNotificationService.sendNotification(studentId, {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}
