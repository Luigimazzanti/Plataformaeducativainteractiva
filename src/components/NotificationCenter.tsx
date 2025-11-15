/*
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  NOTIFICATION CENTER - V9.7                                           ║
 * ║  FIX: CORREGIDO BUCLE INFINITO DE NOTIFICACIONES                      ║
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
import { initializeRealtimeNotifications } from '../utils/realtime-notifications';
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

  // <--- CAMBIO 1: 'loadNotifications' ahora está en un 'useCallback' --- >
  // Esto asegura que la función no se recree en cada renderizado.
  const loadNotifications = useCallback(async () => {
    console.log('[NotifCenter] Cargando notificaciones...');
    setIsLoading(true);
    try {
      // Usamos el apiClient que ya tiene el token
      const data = await apiClient.getNotifications(userId);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // Depende solo de userId

  // <--- CAMBIO 2: 'useEffect' modificado para romper el loop --- >
  useEffect(() => {
    if (!userId) return;

    // Carga inicial
    loadNotifications();

    // Función que se llamará cuando llegue una notificación en tiempo real
    const onNewNotification = (newNotification: Notification) => {
      console.log('🔔 [NotifCenter] Evento de nueva notificación recibido', newNotification);
      
      // --- ¡ESTA ES LA CORRECCIÓN CLAVE! ---
      // En lugar de llamar a `loadNotifications()` (que causa el loop),
      // añadimos la nueva notificación directamente al estado.
      setNotifications((currentNotifications) => {
        // Evitar duplicados si el evento llega muy rápido
        if (currentNotifications.find(n => n.id === newNotification.id)) {
          return currentNotifications;
        }
        return [newNotification, ...currentNotifications];
      });
    };

    // Inicializar el servicio de notificaciones en tiempo real
    const cleanup = initializeRealtimeNotifications(userId, onNewNotification);

    // Limpiar la suscripción al desmontar el componente
    return () => {
      console.log('[NotifCenter] Limpiando suscripción de notificaciones');
      cleanup();
    };
  }, [userId, loadNotifications]); // <--- Se ejecuta si 'userId' o 'loadNotifications' cambian
  // <--- FIN CAMBIO 2 --- >

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
      // Revertir si hay un error (opcional)
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