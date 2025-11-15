import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { realtimeNotificationService } from '../utils/realtime-notifications';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

/**
 * Indicador visual del estado de conexión en tiempo real
 * Útil para debugging y monitoreo
 */

interface RealtimeStatusIndicatorProps {
  showLabel?: boolean;
  compact?: boolean;
}

export function RealtimeStatusIndicator({ 
  showLabel = false,
  compact = true 
}: RealtimeStatusIndicatorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Verificar estado inicial
    const connected = realtimeNotificationService.getConnectionStatus();
    const currentUserId = realtimeNotificationService.getCurrentUserId();
    
    setIsConnected(connected);
    setUserId(currentUserId);
    setIsConnecting(!connected && currentUserId !== null);

    // Escuchar eventos de conexión
    const unsubscribeConnected = realtimeNotificationService.on('connected', () => {
      setIsConnected(true);
      setIsConnecting(false);
    });

    const unsubscribePoll = realtimeNotificationService.on('poll:request', () => {
      // Si está haciendo polling, significa que no está conectado via WebSocket
      setIsConnected(false);
      setIsConnecting(false);
    });

    // Verificar periódicamente el estado
    const interval = setInterval(() => {
      const status = realtimeNotificationService.getConnectionStatus();
      const id = realtimeNotificationService.getCurrentUserId();
      
      setIsConnected(status);
      setUserId(id);
      setIsConnecting(!status && id !== null);
    }, 5000);

    return () => {
      unsubscribeConnected();
      unsubscribePoll();
      clearInterval(interval);
    };
  }, []);

  if (!userId) {
    return null; // No mostrar si no hay usuario conectado
  }

  const getStatusInfo = () => {
    if (isConnected) {
      return {
        icon: <Wifi className="w-3 h-3" />,
        label: 'Tiempo Real Activo',
        variant: 'default' as const,
        className: 'bg-green-500 hover:bg-green-600 text-white'
      };
    } else if (isConnecting) {
      return {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        label: 'Conectando...',
        variant: 'secondary' as const,
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
      };
    } else {
      return {
        icon: <WifiOff className="w-3 h-3" />,
        label: 'Modo Local',
        variant: 'destructive' as const,
        className: 'bg-gray-500 hover:bg-gray-600 text-white'
      };
    }
  };

  const statusInfo = getStatusInfo();

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={statusInfo.variant}
              className={`${statusInfo.className} cursor-help gap-1 text-xs`}
            >
              {statusInfo.icon}
              {showLabel && <span>{statusInfo.label}</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{statusInfo.label}</p>
              {isConnected && (
                <p className="text-muted-foreground">
                  Las notificaciones se reciben al instante via WebSocket
                </p>
              )}
              {!isConnected && !isConnecting && (
                <p className="text-muted-foreground">
                  Notificaciones almacenadas localmente
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge 
      variant={statusInfo.variant}
      className={`${statusInfo.className} gap-2`}
    >
      {statusInfo.icon}
      <span>{statusInfo.label}</span>
    </Badge>
  );
}
