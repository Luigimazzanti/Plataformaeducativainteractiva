/*
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  LOGIN FORM - V10.7 (SOLUCIÓN FULL-STACK)                             ║
 * ║  FIX: Eliminado el 'if (isDemoMode())' al inicio de 'handleLogin'     ║
 * ║       que causaba un bucle de login demo y bloqueaba el inicio real.  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
import { useState } from 'react';
import { apiClient } from '../utils/api';
import { AuthManager } from '../utils/auth-manager';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GraduationCap, BookOpen, AlertCircle, Globe } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useLanguage, Language, languageNames } from '../utils/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { isDemoMode, demoModeAPI, disableDemoMode } from '../utils/demo-mode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { SupabaseStatus } from './SupabaseStatus';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const { t, language, setLanguage } = useLanguage();
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<'teacher' | 'student'>('student');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if logging in as admin
      if (loginEmail === 'admin' && loginPassword === 'EduConnect@Admin2024') {
        const adminToken = `admin_${Date.now()}`;
        const adminUser = {
          id: 'admin',
          email: 'admin@educonnect.com',
          name: 'Administrator',
          role: 'admin',
        };
        // Guardar token usando AuthManager
        AuthManager.saveToken(adminToken);
        AuthManager.saveUserId(adminUser.id);
        apiClient.setToken(adminToken);
        console.log('[Login] ✅ Admin autenticado con token guardado');
        onLoginSuccess(adminUser);
        return;
      }

      // <--- ¡AQUÍ ESTABA EL ERROR! --- >
      // El bloque 'if (isDemoMode())' se eliminó de aquí.
      // Ya no quedaremos atrapados en el modo demo.
      // <--- FIN DEL ARREGLO --- >

      // ✅ IMPORTANTE: Desactivar modo demo temporalmente para intentar conectar a Supabase
      disableDemoMode();
      console.log('[Login] 🔄 Intentando conectar a Supabase...');

      // Try login through backend API (which handles both real auth and demo credentials)
      const { user, token } = await apiClient.login(loginEmail, loginPassword);
      console.log('[Login] ✅ Usuario autenticado con backend');
      
      // Guardar token usando AuthManager
      AuthManager.saveToken(token);
      AuthManager.saveUserId(user.id);
      apiClient.setToken(token);
      
      // Store current user for demo credentials detection
      localStorage.setItem('educonnect_current_user', user.id);
      
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Si es un error de red o 'DEMO_MODE', intentar modo demo directamente
      // Esta es la lógica de FALLBACK correcta.
      if (err.message === 'DEMO_MODE' || err.message.includes('Failed to fetch')) {
        console.log('[Login] 🔧 Backend no disponible, activando modo demo...');
        
        // Enable demo mode
        localStorage.setItem('educonnect_demo_mode', 'true');
        
        // Try demo mode login
        try {
          const { user, token } = await demoModeAPI.login(loginEmail, loginPassword);
          AuthManager.saveToken(token);
          AuthManager.saveUserId(user.id);
          apiClient.setToken(token);
          console.log('[Login] ✅ Modo demo activado, usuario autenticado');
          
          onLoginSuccess(user);
          return;
        } catch (demoErr: any) {
          console.error('Demo login error:', demoErr);
          setError('❌ ' + demoErr.message);
          setIsLoading(false);
          return;
        }
      }
      
      // Provide user-friendly error messages
      let errorMsg = err.message || t('loginError');
      
      if (errorMsg.includes('Invalid login credentials') || 
          errorMsg.includes('Email not confirmed') ||
          errorMsg === 'Usuario no encontrado' ||
          errorMsg === 'Credenciales incorrectas') {
        errorMsg = '❌ Credenciales incorrectas. Por favor verifica tu email y contraseña. Si no tienes cuenta, créala en la pestaña "Registrarse".';
      } else if (errorMsg.includes('Email not found') || errorMsg.includes('User not found')) {
        errorMsg = '⚠️ Email no registrado. ¿Quieres crear una cuenta? Ve a la pestaña "Registrarse".';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Clear any previous demo mode flag to allow backend features
      localStorage.removeItem('educonnect_demo_mode');
      
      const { user, token } = await apiClient.signup({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        role: signupRole,
      });

      // Guardar token usando AuthManager
      AuthManager.saveToken(token);
      AuthManager.saveUserId(user.id);
      apiClient.setToken(token);
      
      console.log('[Signup] ✅ Usuario registrado y autenticado, token guardado');
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Provide user-friendly error messages
      let errorMsg = err.message || t('signupError');
      
      if (errorMsg.includes('already been registered') || 
          errorMsg.includes('User already registered') ||
          errorMsg.includes('duplicate key')) {
        errorMsg = '⚠️ Este email ya está registrado. Cambiando a la pestaña "Iniciar sesión"...';
        // Switch to login tab and pre-fill email
        setTimeout(() => {
          setActiveTab('login');
          setLoginEmail(signupEmail);
          setLoginPassword('');
          setError('Ya tienes una cuenta. Por favor ingresa tu contraseña para acceder.');
        }, 2000);
      } else if (errorMsg.includes('Password should be')) {
        errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (errorMsg.includes('Invalid email')) {
        errorMsg = 'Por favor ingresa un email válido.';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageFlag = (lang: Language): string => {
    const flags: Record<Language, string> = {
      es: '🇪🇸',
      en: '🇬🇧',
      it: '🇮🇹',
      de: '🇩🇪',
      fr: '🇫🇷',
      pt: '🇵🇹',
      zh: '🇨🇳',
      ja: '🇯🇵',
    };
    return flags[lang] || '🌐';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gradient-from via-gradient-via to-gradient-to p-4">
      <div className="w-full max-w-md">
        {/* Demo Mode Banner */}
        {isDemoMode() && (
          <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
              <div className="space-y-1">
                <p className="font-semibold">🔴 MODO DEMO ACTIVO</p>
                <p className="text-[11px]">
                  La aplicación funciona sin Supabase. Los datos se guardan localmente.
                </p>
                <p className="text-[10px] text-muted-foreground italic">
                  💡 Para conectar Supabase: arranca el servidor local (`npx supabase start`)
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="relative mb-4">
            {/* Language Switcher - Compact and positioned top-right */}
            <div className="absolute -top-2 right-0 z-10">
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="w-[70px] h-8 border-none shadow-none hover:bg-accent/50 transition-colors px-2">
                  <SelectValue>
                    <span className="text-xl">{getLanguageFlag(language)}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end" className="min-w-[150px]">
                  {Object.entries(languageNames).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getLanguageFlag(code as Language)}</span>
                        <span className="text-sm">{name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Logo - Centered and stable */}
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-primary to-secondary p-3 sm:p-4 rounded-full">
                <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            EduConnect
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">{t('welcomeMessage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'signup'); setError(''); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signup')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Alert className="mb-4 border-lime-500 bg-lime-50 dark:bg-lime-950/20">
                <BookOpen className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                <AlertDescription className="text-xs text-lime-800 dark:text-lime-300">
                  <div className="space-y-1">
                    <p className="font-semibold mb-2">✨ Cuentas de prueba:</p>
                    <div className="space-y-1 text-[11px]">
                      <div><strong>Admin:</strong> admin / EduConnect@Admin2024</div>
                      <div><strong>Profesor:</strong> teacher@demo.com / demo123</div>
                      <div><strong>Estudiante:</strong> student@demo.com / demo123</div>
                    </div>
                    <p className="mt-2 text-muted-foreground italic text-[10px]">
                      💡 Usa estas credenciales para probar la plataforma.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('email')}</Label>
                  <Input
                    id="login-email"
                    type="text"
                    placeholder={t('enterEmail')}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('password')}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('loggingIn') : t('login')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('fullName')}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={t('enterName')}
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t('enterEmail')}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('iAm')}</Label>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setSignupRole('student')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                        signupRole === 'student'
                          ? 'border-secondary bg-cyan-50 dark:bg-cyan-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-secondary flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-center">{t('student')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupRole('teacher')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                        signupRole === 'teacher'
                          ? 'border-primary bg-lime-50 dark:bg-lime-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-primary flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-center">{t('teacher')}</span>
                    </button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('creatingAccount') : t('createAccount')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Diagnóstico de Supabase */}
      <div className="mt-4 text-center">
        <Dialog open={showDiagnostic} onOpenChange={setShowDiagnostic}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              🔧 Diagnóstico de Conexión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🔧 Estado de Conexión Supabase</DialogTitle>
            </DialogHeader>
            <SupabaseStatus />
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  );
}