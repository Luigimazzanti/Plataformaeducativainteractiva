import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export function DiagnosticoIA() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Health Check', status: 'pending', message: 'No ejecutado' },
    { name: 'Test Simple (sin IA)', status: 'pending', message: 'No ejecutado' },
    { name: 'Test con Gemini IA', status: 'pending', message: 'No ejecutado' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    const token = localStorage.getItem('educonnect_auth_token') || publicAnonKey;

    // Test 1: Health Check
    updateTest(0, { status: 'running', message: 'Verificando...' });
    try {
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/final_server/make-server-05c2b65f/health`;
      console.log('[Diagnostico] Health check URL:', healthUrl);
      
      const healthRes = await fetch(healthUrl, {
        headers: {
          'apikey': publicAnonKey, // ✅ CRÍTICO: Header requerido por Supabase
        }
      });
      console.log('[Diagnostico] Health check status:', healthRes.status);
      
      if (healthRes.ok) {
        const data = await healthRes.json();
        updateTest(0, { 
          status: 'success', 
          message: '✅ final_server está desplegado y funcionando',
          details: data
        });
      } else {
        updateTest(0, { 
          status: 'error', 
          message: `❌ Error ${healthRes.status}: final_server NO responde correctamente`,
          details: { status: healthRes.status, url: healthUrl }
        });
        setIsRunning(false);
        return;
      }
    } catch (error: any) {
      console.error('[Diagnostico] Health check error:', error);
      updateTest(0, { 
        status: 'error', 
        message: `❌ Error de red: ${error.message}`,
        details: { error: error.message, hint: 'final_server probablemente NO está desplegado' }
      });
      setIsRunning(false);
      return;
    }

    // Test 2: Test Simple (sin IA)
    updateTest(1, { status: 'running', message: 'Probando comunicación...' });
    try {
      const testUrl = `https://${projectId}.supabase.co/functions/v1/final_server/make-server-05c2b65f/test-simple`;
      console.log('[Diagnostico] Test simple URL:', testUrl);
      
      const testRes = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': publicAnonKey, // ✅ CRÍTICO: Header requerido por Supabase
        },
        body: JSON.stringify({
          text: 'La fotosíntesis es el proceso mediante el cual las plantas convierten la luz solar en energía química.',
          maxQuestions: 3
        })
      });
      
      console.log('[Diagnostico] Test simple status:', testRes.status);
      
      if (testRes.ok) {
        const data = await testRes.json();
        updateTest(1, { 
          status: 'success', 
          message: '✅ Comunicación con final_server funciona perfectamente',
          details: data
        });
      } else {
        const errorData = await testRes.json().catch(() => ({ error: 'Unknown' }));
        updateTest(1, { 
          status: 'error', 
          message: `❌ Error ${testRes.status}: ${errorData.error || 'Error desconocido'}`,
          details: errorData
        });
        setIsRunning(false);
        return;
      }
    } catch (error: any) {
      console.error('[Diagnostico] Test simple error:', error);
      updateTest(1, { 
        status: 'error', 
        message: `❌ Error: ${error.message}`,
        details: { error: error.message }
      });
      setIsRunning(false);
      return;
    }

    // Test 3: Test con Gemini IA
    updateTest(2, { status: 'running', message: 'Probando Gemini IA...' });
    try {
      const aiUrl = `https://${projectId}.supabase.co/functions/v1/final_server/make-server-05c2b65f/ai/generate-questions`;
      console.log('[Diagnostico] AI URL:', aiUrl);
      
      const aiRes = await fetch(aiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': publicAnonKey, // ✅ CRÍTICO: Header requerido por Supabase
          'apikey': publicAnonKey, // ⚡ FIX: Supabase requiere 'apikey' header
        },
        body: JSON.stringify({
          text: 'La fotosíntesis es el proceso mediante el cual las plantas convierten la luz solar en energía química. Este proceso ocurre en los cloroplastos, que contienen clorofila, el pigmento que da a las plantas su color verde. Durante la fotosíntesis, las plantas absorben dióxido de carbono del aire y agua del suelo.',
          maxQuestions: 3,
          includeCompletarBlancos: false
        })
      });
      
      console.log('[Diagnostico] AI status:', aiRes.status);
      
      if (aiRes.ok) {
        const data = await aiRes.json();
        updateTest(2, { 
          status: 'success', 
          message: `✅ ¡Gemini IA funciona! Generó ${data.questions?.length || 0} preguntas`,
          details: data
        });
      } else {
        const errorData = await aiRes.json().catch(() => ({ error: 'Unknown' }));
        console.error('[Diagnostico] AI error data:', errorData);
        
        let message = `❌ Error ${aiRes.status}: ${errorData.error || 'Error desconocido'}`;
        let hint = '';
        
        if (errorData.error?.includes('GEMINI_API_KEY')) {
          hint = '💡 SOLUCIÓN: Configura GEMINI_API_KEY en Supabase Dashboard → Settings → Edge Functions';
        } else if (aiRes.status === 401 || aiRes.status === 403) {
          hint = '💡 SOLUCIÓN: Verifica que tu clave de Gemini sea válida en https://aistudio.google.com/apikey';
        }
        
        updateTest(2, { 
          status: 'error', 
          message: message + (hint ? '\n' + hint : ''),
          details: errorData
        });
      }
    } catch (error: any) {
      console.error('[Diagnostico] AI error:', error);
      updateTest(2, { 
        status: 'error', 
        message: `❌ Error: ${error.message}`,
        details: { error: error.message }
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<string, string> = {
      success: 'bg-green-500/10 text-green-600 border-green-500/20',
      error: 'bg-red-500/10 text-red-600 border-red-500/20',
      running: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      pending: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    
    return (
      <Badge variant="outline" className={variants[status]}>
        {status === 'running' ? 'Ejecutando...' : status === 'success' ? 'Éxito' : status === 'error' ? 'Error' : 'Pendiente'}
      </Badge>
    );
  };

  const allSuccess = tests.every(t => t.status === 'success');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            Diagnóstico del Generador IA
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Este test verificará si final_server está correctamente desplegado y configurado
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.map((test, index) => (
            <Card key={index} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIcon(test.status)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{test.name}</h4>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {test.message}
                    </p>
                    {test.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:underline">
                          Ver detalles técnicos
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ejecutando tests...
                </>
              ) : (
                'Ejecutar Diagnóstico'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Cerrar
            </Button>
          </div>

          {allSuccess && !isRunning && (
            <Card className="border-green-500 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-medium">
                    ¡Todo funciona correctamente! El generador IA está listo para usar.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Cierra este diagnóstico y prueba el generador en "Crear Tarea" → ⚡ Generador IA
                </p>
              </CardContent>
            </Card>
          )}

          {tests.some(t => t.status === 'error') && !isRunning && (
            <Card className="border-red-500 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-600">
                      Se detectaron problemas
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Revisa los mensajes de error arriba y sigue las soluciones sugeridas.
                    </p>
                    {tests[0].status === 'error' && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                        <p className="font-medium text-yellow-700">Problema principal detectado:</p>
                        <p className="mt-1">final_server NO está desplegado correctamente en Supabase.</p>
                        <p className="mt-2">Solución:</p>
                        <ol className="list-decimal list-inside space-y-1 mt-1">
                          <li>Ve a: <code className="text-xs bg-black/10 px-1 rounded">https://supabase.com/dashboard/project/{projectId}/functions</code></li>
                          <li>Verifica que la función <code className="text-xs bg-black/10 px-1 rounded">final_server</code> esté desplegada</li>
                          <li>Si no existe, copia los archivos de /supabase/functions/final_server/</li>
                          <li>Click en "Deploy"</li>
                          <li>Ejecuta este diagnóstico de nuevo</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
