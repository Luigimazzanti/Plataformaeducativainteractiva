import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
import { Notification } from './notifications';
import { isDemoMode } from './demo-mode';

/**
 * ════════════════════════════════════════════════════════════════════════
 * SISTEMA DE NOTIFICACIONES EN TIEMPO REAL
 * ════════════════════════════════════════════════════════════════════════
 * 
 * Sistema completo de notificaciones push en tiempo real usando Supabase Realtime.
 * 
 * Características:
 * - Conexión persistente via WebSocket (Supabase Channels)
 * - Notificaciones instantáneas sin recargar
 * - Sincronización automática entre pestañas
 * - Fallback a polling si WebSocket falla
 * - Soporte para modo demo
 * 
 * Arquitectura:
 * 1. Backend emite eventos en canal 'notifications:user_id'
 * 2. Frontend se suscribe al canal del usuario actual
 * 3. Al recibir evento, actualiza UI instantáneamente
 * 4. Persistencia en Supabase + cache local
 */

export type NotificationEventType = 
  | 'notification:new'
  | 'notification:read'
  | 'notification:deleted'
  | 'notification:all_read';

export interface NotificationEvent {
  type: NotificationEventType;
  notification?: Notification;
  notificationIds?: string[];
  timestamp: string;
  userId: string;
}

export class RealtimeNotificationService {
  private channel: RealtimeChannel | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pollingInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  constructor() {
    console.log('🔔 [RealtimeNotificationService] Servicio inicializado');
  }

  /**
   * Conecta al canal de notificaciones en tiempo real del usuario
   */
  connect(userId: string, token?: string) {
    // 🔧 ARREGLO: Verificar que supabase esté disponible
    if (!supabase) {
      console.warn('⚠️ [RealtimeNotificationService] Cliente de Supabase no disponible');
      return;
    }
    
    if (this.isConnected && this.userId === userId) {
      console.log('🔔 [RealtimeNotificationService] Ya conectado al canal del usuario:', userId);
      return;
    }

    // Si había una conexión previa, desconectarla
    if (this.channel) {
      this.disconnect();
    }

    this.userId = userId;

    console.log('🔔 [RealtimeNotificationService] Conectando al canal de notificaciones:', userId);

    // Crear canal específico para el usuario
    const channelName = `notifications:${userId}`;
    this.channel = supabase.channel(channelName);

    // Escuchar eventos de notificaciones
    this.channel
      .on('broadcast', { event: 'notification:new' }, (payload) => {
        console.log('🔔 [RealtimeNotificationService] Nueva notificación recibida:', payload);
        this.emit('notification:new', payload);
      })
      .on('broadcast', { event: 'notification:read' }, (payload) => {
        console.log('🔔 [RealtimeNotificationService] Notificación marcada como leída:', payload);
        this.emit('notification:read', payload);
      })
      .on('broadcast', { event: 'notification:deleted' }, (payload) => {
        console.log('🔔 [RealtimeNotificationService] Notificación eliminada:', payload);
        this.emit('notification:deleted', payload);
      })
      .on('broadcast', { event: 'notification:all_read' }, (payload) => {
        console.log('🔔 [RealtimeNotificationService] Todas las notificaciones marcadas como leídas:', payload);
        this.emit('notification:all_read', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ [RealtimeNotificationService] Conectado al canal:', channelName);
          this.emit('connected', { userId });

          // Detener polling si estaba activo
          if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
          }
        } else if (status === 'CHANNEL_ERROR') {
          // Solo mostrar log si no estamos en modo demo (para evitar errores innecesarios)
          if (!isDemoMode()) {
            console.log('⚠️ [RealtimeNotificationService] Canal no disponible, usando polling');
          }
          this.startPolling(userId);
        } else if (status === 'TIMED_OUT') {
          // Solo mostrar log si no estamos en modo demo
          if (!isDemoMode()) {
            console.error('⏱️ [RealtimeNotificationService] Timeout, reintentando...');
          }
          this.handleReconnect(userId, token);
        } else if (status === 'CLOSED') {
          this.isConnected = false;
          console.log('🔌 [RealtimeNotificationService] Canal cerrado');
        }
      });
  }

  /**
   * Desconecta del canal de notificaciones
   */
  disconnect() {
    if (this.channel && supabase) {
      console.log('🔌 [RealtimeNotificationService] Desconectando del canal');
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.isConnected = false;
      this.userId = null;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.listeners.clear();
  }

  /**
   * Maneja la reconexión automática
   */
  private handleReconnect(userId: string, token?: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Solo mostrar log si no estamos en modo demo
      if (!isDemoMode()) {
        console.error('❌ [RealtimeNotificationService] Máximo de reintentos alcanzado, usando polling');
      }
      this.startPolling(userId);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    // Solo mostrar log si no estamos en modo demo
    if (!isDemoMode()) {
      console.log(`🔄 [RealtimeNotificationService] Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    }

    setTimeout(() => {
      this.connect(userId, token);
    }, delay);
  }

  /**
   * Inicia polling como fallback cuando WebSocket no está disponible
   */
  private startPolling(userId: string) {
    if (this.pollingInterval) {
      return; // Ya está haciendo polling
    }

    console.log('📡 [RealtimeNotificationService] Iniciando polling (fallback mode)');
    
    // Polling cada 5 segundos
    this.pollingInterval = setInterval(() => {
      this.emit('poll:request', { userId });
    }, 5000);
  }

  /**
   * Envía una notificación a través del canal
   */
  async sendNotification(targetUserId: string, notification: Notification) {
    if (!this.channel) {
      console.warn('⚠️ [RealtimeNotificationService] No hay canal activo, no se puede enviar');
      return;
    }

    const event: NotificationEvent = {
      type: 'notification:new',
      notification,
      timestamp: new Date().toISOString(),
      userId: targetUserId,
    };

    await this.channel.send({
      type: 'broadcast',
      event: 'notification:new',
      payload: event,
    });

    console.log('📤 [RealtimeNotificationService] Notificación enviada:', event);
  }

  /**
   * Registra un listener para eventos de notificaciones
   */
  on(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    console.log(`👂 [RealtimeNotificationService] Listener registrado para: ${eventType}`);

    // Devolver función para desregistrar
    return () => {
      this.off(eventType, callback);
    };
  }

  /**
   * Elimina un listener
   */
  off(eventType: string, callback: Function) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.delete(callback);
      console.log(`🔇 [RealtimeNotificationService] Listener eliminado para: ${eventType}`);
    }
  }

  /**
   * Emite un evento a todos los listeners registrados
   */
  private emit(eventType: string, payload: any) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`❌ [RealtimeNotificationService] Error en listener de ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Verifica si está conectado
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Obtiene el ID del usuario actual
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }
}

// Singleton instance
export const realtimeNotificationService = new RealtimeNotificationService();