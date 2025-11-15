import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Bell, CheckCheck, Filter, FileText, Award, Send, BookOpen, X, Trash2 } from 'lucide-react';
import { NotificationManager, Notification } from '../utils/notifications';
import { apiClient } from '../utils/api';
import { realtimeNotificationService } from '../utils/realtime-notifications';

interface NotificationCenterProps {
  userRole: 'student' | 'teacher' | 'admin';
  userId?: string;
  onNavigate?: (notification: Notification) => void;
}

// Agrupación por días
type NotificationGroup = {
  label: string;
  notifications: Notification[];
};

function groupNotificationsByDate(notifications: Notification[]): NotificationGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups: { [key: string]: Notification[] } = {
    'Hoy': [],
    'Ayer': [],
    'Esta semana': [],
    'Más antiguas': []
  };

  notifications.forEach(notification => {
    const notifDate = new Date(notification.createdAt);
    const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

    if (notifDay.getTime() === today.getTime()) {
      groups['Hoy'].push(notification);
    } else if (notifDay.getTime() === yesterday.getTime()) {
      groups['Ayer'].push(notification);
    } else if (notifDate >= lastWeek) {
      groups['Esta semana'].push(notification);
    } else {
      groups['Más antiguas'].push(notification);
    }
  });

  // Filtrar grupos vacíos y devolver
  return Object.entries(groups)
    .filter(([_, notifs]) => notifs.length > 0)
    .map(([label, notifications]) => ({ label, notifications }));
}

export function NotificationCenter({ userRole, userId, onNavigate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnectedRealtime, setIsConnectedRealtime] = useState(false);

  const loadNotifications = async () => {
    try {
      // Intentar cargar desde el backend primero
      const { notifications: backendNotifications } = await apiClient.getNotifications();
      // Normalizar el campo is_read -> read para compatibilidad
      const normalizedNotifications = backendNotifications.map((n: any) => ({
        ...n,
        read: n.is_read !== undefined ? n.is_read : n.read,
      }));
      setNotifications(normalizedNotifications || []);
      console.log('🔔 [NotificationCenter] Notificaciones cargadas desde backend:', {
        role: userRole,
        total: normalizedNotifications?.length || 0,
        unread: normalizedNotifications?.filter((n: Notification) => !n.read).length || 0
      });
    } catch (error: any) {
      // 🔧 Silenciar errores de autenticación en polling
      const isAuthError = 
        error?.message === 'No user logged in' ||
        error?.message === 'Unauthorized' ||
        error?.message?.includes('Unauthorized') ||
        error?.message?.includes('Not authenticated');
      
      if (!isAuthError) {
        console.log('🔔 [NotificationCenter] Backend no disponible, usando localStorage');
      }
      
      // Si falla el backend, usar localStorage
      const allNotifications = NotificationManager.getNotifications(userRole);
      setNotifications(allNotifications);
      
      if (!isAuthError) {
        console.log('🔔 [NotificationCenter] Notificaciones cargadas desde localStorage:', {
          role: userRole,
          total: allNotifications.length,
          unread: allNotifications.filter(n => !n.read).length
        });
      }
    }
  };

  useEffect(() => {
    loadNotifications();

    // Conectar a tiempo real si tenemos userId
    if (userId) {
      console.log('🔔 [NotificationCenter] Conectando a tiempo real para usuario:', userId);
      realtimeNotificationService.connect(userId);

      // Listener para nuevas notificaciones
      const unsubscribeNew = realtimeNotificationService.on('notification:new', (payload: any) => {
        console.log('🔔 [NotificationCenter] Nueva notificación en tiempo real:', payload);
        loadNotifications();
        
        // Mostrar toast o animación
        if (payload.notification) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuAy/DZiDQHF2Sx6+mgUhEHTp3h8LZhGgU5k9fy0H0wBSN0xO/glkENFly06et4Tgv');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
      });

      const unsubscribeRead = realtimeNotificationService.on('notification:read', () => {
        console.log('🔔 [NotificationCenter] Notificación marcada como leída en tiempo real');
        loadNotifications();
      });

      const unsubscribeDeleted = realtimeNotificationService.on('notification:deleted', () => {
        console.log('🔔 [NotificationCenter] Notificación eliminada en tiempo real');
        loadNotifications();
      });

      const unsubscribeAllRead = realtimeNotificationService.on('notification:all_read', () => {
        console.log('🔔 [NotificationCenter] Todas las notificaciones marcadas como leídas en tiempo real');
        loadNotifications();
      });

      const unsubscribeConnected = realtimeNotificationService.on('connected', () => {
        console.log('✅ [NotificationCenter] Conectado a tiempo real');
        setIsConnectedRealtime(true);
      });

      const unsubscribePoll = realtimeNotificationService.on('poll:request', () => {
        console.log('📡 [NotificationCenter] Polling activo, recargando notificaciones');
        loadNotifications();
      });

      return () => {
        unsubscribeNew();
        unsubscribeRead();
        unsubscribeDeleted();
        unsubscribeAllRead();
        unsubscribeConnected();
        unsubscribePoll();
      };
    }

    // Fallback: Auto-refresh cada 30 segundos si no hay tiempo real
    const intervalId = setInterval(() => {
      if (!realtimeNotificationService.getConnectionStatus()) {
        console.log('🔔 [NotificationCenter] Auto-refresh (sin tiempo real)...');
        loadNotifications();
      }
    }, 30000);

    // Escuchar eventos de nuevas notificaciones (localStorage)
    const handleNewNotification = () => {
      console.log('🔔 [NotificationCenter] Nueva notificación detectada (localStorage)');
      loadNotifications();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes('notifications') || e.key.includes('submissions'))) {
        console.log('🔔 [NotificationCenter] Storage cambió:', e.key);
        loadNotifications();
      }
    };

    window.addEventListener('submission-added', handleNewNotification);
    window.addEventListener('notification-added', handleNewNotification as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('submission-added', handleNewNotification);
      window.removeEventListener('notification-added', handleNewNotification as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userRole, userId]);

  // Cuando se abre el dropdown, marcar las notificaciones no leídas como leídas
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      const unreadIds = notifications
        .filter(n => !n.read && !n.is_read)
        .map(n => n.id);

      if (unreadIds.length > 0) {
        console.log('🔔 [NotificationCenter] Marcando notificaciones como leídas al abrir:', unreadIds);
        
        // Marcar como leídas en el backend (async, no bloqueante)
        apiClient.markNotificationsAsRead(unreadIds)
          .then(result => {
            if (result.success) {
              console.log('🔔 [NotificationCenter] Notificaciones marcadas como leídas en BD:', result.updatedCount);
              // Recargar notificaciones para reflejar el cambio
              loadNotifications();
            }
          })
          .catch(error => {
            console.log('🔔 [NotificationCenter] Error al marcar como leídas, usando localStorage:', error);
            // Fallback a localStorage
            unreadIds.forEach(id => NotificationManager.markAsRead(id));
            loadNotifications();
          });
      }
    }
  }, [isOpen]); // ← 🔧 ARREGLO: Remover 'notifications' para evitar bucle infinito

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔔 [NotificationCenter] Marcando como leída:', notificationId);
    
    try {
      // Intentar marcar en el backend primero
      await apiClient.markNotificationsAsRead([notificationId]);
      console.log('🔔 [NotificationCenter] Marcada como leída en backend');
    } catch (error) {
      // Si falla, usar localStorage
      console.log('🔔 [NotificationCenter] Backend no disponible, usando localStorage');
      NotificationManager.markAsRead(notificationId);
    }
    
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    console.log('🔔 [NotificationCenter] Marcando todas como leídas');
    
    try {
      // Intentar marcar en el backend primero
      await apiClient.markAllNotificationsAsRead();
      console.log('🔔 [NotificationCenter] Todas marcadas como leídas en backend');
    } catch (error) {
      // Si falla, usar localStorage
      console.log('🔔 [NotificationCenter] Backend no disponible, usando localStorage');
      NotificationManager.markAllAsRead(userRole);
    }
    
    loadNotifications();
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔔 [NotificationCenter] Eliminando notificación:', notificationId);
    
    try {
      // Intentar eliminar en el backend primero
      await apiClient.deleteNotification(notificationId);
      console.log('🔔 [NotificationCenter] Eliminada en backend');
    } catch (error) {
      // Si falla, usar localStorage
      console.log('🔔 [NotificationCenter] Backend no disponible, usando localStorage');
      NotificationManager.deleteNotification(notificationId);
    }
    
    loadNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    console.log('🔔 [NotificationCenter] Click en notificación:', notification);
    
    // Marcar como leída
    if (!notification.read) {
      try {
        await apiClient.markNotificationsAsRead([notification.id]);
        console.log('🔔 [NotificationCenter] Marcada como leída en backend');
      } catch (error) {
        console.log('🔔 [NotificationCenter] Backend no disponible, usando localStorage');
        NotificationManager.markAsRead(notification.id);
      }
      loadNotifications();
    }

    // Navegar si hay callback
    if (onNavigate) {
      onNavigate(notification);
      setIsOpen(false);
    }
  };

  const filteredNotifications = showUnreadOnly
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_assignment':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'new_grade':
      case 'new_feedback':
        return <Award className="w-4 h-4 text-green-500" />;
      case 'submission_received':
        return <Send className="w-4 h-4 text-purple-500" />;
      case 'review_request':
        return <BookOpen className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_assignment':
        return 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900';
      case 'new_grade':
      case 'new_feedback':
        return 'bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900';
      case 'submission_received':
        return 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900';
      case 'review_request':
        return 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900';
      default:
        return 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              title={showUnreadOnly ? 'Mostrar todas' : 'Mostrar no leídas'}
            >
              <Filter className={`w-4 h-4 ${showUnreadOnly ? 'text-primary' : ''}`} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleMarkAllAsRead}
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {showUnreadOnly ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-2">
              {groupNotificationsByDate(filteredNotifications).map(group => (
                <div key={group.label}>
                  <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {group.label}
                  </div>
                  {group.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        relative rounded-lg p-3 cursor-pointer transition-all
                        ${!notification.read ? 'border-l-4 border-l-primary' : ''}
                        ${getNotificationColor(notification.type)}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                              >
                                Marcar como leída
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}