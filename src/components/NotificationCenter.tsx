/*
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  NOTIFICATION CENTER - V10.4 (SOLUCIÓN FULL-STACK)                    ║
 * ║  FIX: Separados 'useEffect' para carga inicial y 'realtime'           ║
 * ║       para romper el loop infinito de carga/creación de notificaciones. ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Bell, CheckCheck, Info, MessageSquare, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { apiClient } from '../utils/api';
import { RealtimeNotificationService } from '../utils/realtime-notifications';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  userId: string;
  type: 'welcome' | 'submission' | 'grade' | 'comment';
  message: string;
  isRead: boolean;
  ctaUrl?: string;
  createdAt: string;
}

export function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // <--- INICIO DE LA SOLUCIÓN --- >

  // Se mantiene esta función 'useCallback' para que 'markAsRead' pueda llamarla
  const loadNotifications = useCallback(async () => {
    console.log('[NotifCenter] RECARGANDO notificaciones (manual)...');
    setIsLoading(true);
    try {
      const data = await apiClient.getNotifications(userId);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error al recargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // EFECTO 1: Carga inicial de notificaciones.
  // Se ejecuta SÓLO UNA VEZ al montar el componente (y si cambia el userId).
  useEffect(() => {
    if (!userId) return;

    const loadInitialNotifications = async () => {
      console.log('[NotifCenter] EFECTO 1: Cargando notificaciones INICIALES...');
      setIsLoading(true);
      try {
        const data = await apiClient.getNotifications(userId);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Error al cargar notificaciones iniciales:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialNotifications();
  }, [userId]); // Solo depende de userId

  // EFECTO 2: Suscripción a notificaciones en tiempo real.
  // Se ejecuta SÓLO UNA VEZ y configura el listener.
  useEffect(() => {
    if (!userId) return;

    // Esta es la función que se llamará desde el servicio de realtime
    const onNewNotification = (newNotification: Notification) => {
      console.log('🔔 [NotifCenter] EFECTO 2: Evento de nueva notificación recibido', newNotification);
      
      // ESTA ES LA LÓGICA ANTI-LOOP:
      // Solo añadimos la notificación al estado.
      // NO volvemos a llamar a loadNotifications().
      setNotifications((currentNotifications) => {
        if (currentNotifications.find(n => n.id === newNotification.id)) {
          return currentNotifications; // Evitar duplicados
        }
        return [newNotification, ...currentNotifications];
      });
    };

    console.log(`[NotifCenter] EFECTO 2: Creando instancia de RealtimeNotificationService para ${userId}`);
    const notificationService = new RealtimeNotificationService(userId, onNewNotification);

    // Función de limpieza
    return () => {
      console.log('[NotifCenter] EFECTO 2: Limpiando suscripción de notificaciones');
      notificationService.disconnect();
    };
  }, [userId]); // Solo depende de userId

  // <--- FIN DE LA SOLUCIÓN --- >


  const markAsRead = async (notificationId: string | 'all') => {
    // Actualizar UI inmediatamente para mejor respuesta
    setNotifications((current) =>
      current.map((n) =>
        notificationId === 'all' || n.id === notificationId
          ? { ...n, isRead: true }
          : n
      )
    );

    try {
      // Enviar la actualización al backend
      await apiClient.markNotificationsAsRead(userId, notificationId);
    } catch (error) {
      console.error('Error al marcar como leídas:', error);
      // Revertir si hay un error
      loadNotifications();
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'submission':
        return <CheckCheck className="w-5 h-5 text-blue-500" />;
      case 'grade':
        return <Award className="w-5 h-5 text-green-500" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-orange-500" />;
      case 'welcome':
      default:
        return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 animate-pulse"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-lg">Notificaciones</CardTitle>
            {unreadCount > 0 && (
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => markAsRead('all')}
              >
                Marcar todas como leídas
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto opacity-50 mb-4" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 p-4 transition-colors ${
                        !n.isRead ? 'bg-accent/50' : 'bg-transparent'
                      }`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground mb-1">{n.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          title="Marcar como leída"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}