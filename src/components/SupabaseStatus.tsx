import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Database, Key, Server } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { isDemoMode } from '../utils/demo-mode';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'demo'>('checking');
  const [details, setDetails] = useState<any>({});
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    setStatus('checking');

    try {
      // 1. Verificar credenciales
      const hasCredentials = projectId && projectId !== 'DEMO_MODE' && projectId !== 'TU_PROJECT_ID_AQUI';
      const hasAnonKey = publicAnonKey && publicAnonKey.length > 50;

      if (!hasCredentials || !hasAnonKey) {
        setStatus('demo');
        setDetails({
          projectId: projectId || 'NO CONFIGURADO',
          hasAnonKey: hasAnonKey,
          message: 'Credenciales no configuradas - Usando modo DEMO'
        });
        setIsChecking(false);
        return;
      }

      // 2. Verificar si el modo demo está forzado
      if (isDemoMode()) {
        setStatus('demo');
        setDetails({
          projectId,
          hasAnonKey: true,
          message: 'Modo DEMO activado manualmente'
        });
        setIsChecking(false);
        return;
      }

      // 3. Probar conexión al servidor
      const testUrl = `https://${projectId}.supabase.co/functions/v1/server/health`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        setStatus('connected');
        setDetails({
          projectId,
          hasAnonKey: true,
          serverUrl: `https://${projectId}.supabase.co`,
          serverStatus: response.ok ? 'online' : 'error',
          statusCode: response.status,
          message: response.ok ? '✅ Servidor backend respondiendo' : '⚠️ Servidor responde pero con error'
        });
      } catch (fetchError: any) {
        // Si el servidor no responde, pero las credenciales son válidas
        if (fetchError.name === 'AbortError') {
          setStatus('error');
          setDetails({
            projectId,
            hasAnonKey: true,
            serverUrl: `https://${projectId}.supabase.co`,
            message: '⚠️ Timeout - El servidor no responde (puede que el Edge Function no esté desplegado)',
            hint: 'Verifica que el Edge Function "server" esté desplegado en Supabase'
          });
        } else {
          setStatus('error');
          setDetails({
            projectId,
            hasAnonKey: true,
            serverUrl: `https://${projectId}.supabase.co`,
            message: `⚠️ Error de red: ${fetchError.message}`,
            hint: 'El proyecto de Supabase puede no existir o estar pausado'
          });
        }
      }
    } catch (error: any) {
      setStatus('error');
      setDetails({
        projectId: projectId || 'NO CONFIGURADO',
        message: `❌ Error: ${error.message}`
      });
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'demo':
        return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'checking':
        return <Badge className="bg-blue-500">Verificando...</Badge>;
      case 'connected':
        return <Badge className="bg-green-500">✅ Conectado</Badge>;
      case 'error':
        return <Badge className="bg-orange-500">⚠️ Error</Badge>;
      case 'demo':
        return <Badge className="bg-gray-500">🔴 Modo Demo</Badge>;
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold">Estado de Supabase</h3>
            <p className="text-sm text-muted-foreground">Diagnóstico de conexión</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-3 pt-4 border-t">
        {/* Project ID */}
        <div className="flex items-start gap-3">
          <Database className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Project ID</p>
            <p className="text-sm text-muted-foreground font-mono break-all">
              {details.projectId || projectId || 'NO CONFIGURADO'}
            </p>
          </div>
          {details.projectId && details.projectId !== 'NO CONFIGURADO' && details.projectId !== 'DEMO_MODE' && (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
        </div>

        {/* Anon Key */}
        <div className="flex items-start gap-3">
          <Key className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Anon Key</p>
            <p className="text-sm text-muted-foreground font-mono truncate">
              {details.hasAnonKey ? `${publicAnonKey.substring(0, 20)}...` : 'NO CONFIGURADO'}
            </p>
          </div>
          {details.hasAnonKey && (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
        </div>

        {/* Server URL */}
        {details.serverUrl && (
          <div className="flex items-start gap-3">
            <Server className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Server URL</p>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {details.serverUrl}
              </p>
            </div>
            {details.serverStatus === 'online' && (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>
        )}

        {/* Mensaje de estado */}
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-sm">{details.message}</p>
          {details.hint && (
            <p className="text-sm text-muted-foreground mt-2">
              💡 {details.hint}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={checkConnection}
          disabled={isChecking}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Verificar de nuevo
        </Button>

        {status === 'demo' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.open('https://supabase.com/dashboard', '_blank');
            }}
          >
            <Database className="w-4 h-4 mr-2" />
            Abrir Supabase
          </Button>
        )}
      </div>

      {/* Links de ayuda */}
      <div className="pt-4 border-t space-y-2">
        <p className="text-sm font-medium">📚 Guías de configuración:</p>
        <div className="flex flex-col gap-2 text-sm">
          <a 
            href="/README-SUPABASE.md" 
            target="_blank"
            className="text-blue-600 hover:underline flex items-center gap-2 font-semibold"
          >
            <span className="text-lg">📖</span>
            <span>README - Empieza aquí</span>
          </a>
          <a 
            href="/PASOS-SUPABASE.md" 
            target="_blank"
            className="text-blue-600 hover:underline flex items-center gap-2"
          >
            <span className="text-lg">⚡</span>
            <span>Guía rápida de 5 pasos (12 min)</span>
          </a>
          <a 
            href="/INSTRUCCIONES-SUPABASE.md" 
            target="_blank"
            className="text-blue-600 hover:underline flex items-center gap-2"
          >
            <span className="text-lg">📋</span>
            <span>Instrucciones detalladas</span>
          </a>
          <div className="border-t pt-2 mt-2">
            <p className="text-xs text-muted-foreground mb-1">Scripts SQL:</p>
            <div className="flex flex-col gap-1 pl-2">
              <a 
                href="/supabase-quickstart.sql" 
                target="_blank"
                className="text-blue-600 hover:underline flex items-center gap-2 text-xs"
              >
                <span>🚀</span>
                <span>Quick Start (todo-en-uno)</span>
              </a>
              <a 
                href="/supabase-storage-setup.sql" 
                target="_blank"
                className="text-blue-600 hover:underline flex items-center gap-2 text-xs"
              >
                <span>📦</span>
                <span>Configurar Storage</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Instrucciones rápidas si está en demo */}
      {status === 'demo' && (
        <div className="pt-4 border-t space-y-3">
          <p className="text-sm font-semibold text-orange-600">⚡ Pasos rápidos para activar Supabase:</p>
          <ol className="text-xs space-y-2 list-decimal list-inside">
            <li>Ejecutar <code className="bg-muted px-1 rounded">supabase-enable-rls.sql</code> en SQL Editor</li>
            <li>Crear buckets: <code className="bg-muted px-1 rounded">assignments, submissions, notes, avatars</code></li>
            <li>Ejecutar <code className="bg-muted px-1 rounded">supabase-storage-setup.sql</code></li>
            <li>Crear usuarios de prueba en Authentication</li>
            <li>Recargar la aplicación</li>
          </ol>
          <p className="text-xs text-muted-foreground italic">
            💡 Lee <strong>INSTRUCCIONES-SUPABASE.md</strong> para detalles completos
          </p>
        </div>
      )}
    </Card>
  );
}