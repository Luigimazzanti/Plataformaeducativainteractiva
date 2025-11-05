import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { apiClient } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GraduationCap, BookOpen, AlertCircle, Globe } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useLanguage, Language, languageNames } from '../utils/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { isDemoMode, demoModeAPI } from '../utils/demo-mode';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, language, setLanguage } = useLanguage();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<'teacher' | 'student'>('student');

  const supabase = createClient();

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
        apiClient.setToken(adminToken);
        onLoginSuccess(adminUser);
        return;
      }

      // If in demo mode, use demo API directly
      if (isDemoMode()) {
        const { user, token } = await demoModeAPI.login(loginEmail, loginPassword);
        demoModeAPI.setCurrentUser(user.id);
        apiClient.setToken(token);
        onLoginSuccess(user);
        return;
      }

      // Try Supabase login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (signInError) throw signInError;

      if (data.session?.access_token) {
        apiClient.setToken(data.session.access_token);
        const { user } = await apiClient.getCurrentUser();
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = err.message || t('loginError');
      setError(errorMsg === 'Usuario no encontrado' ? 'Credenciales incorrectas. Usa las credenciales de prueba mostradas arriba.' : errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { user } = await apiClient.signup({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        role: signupRole,
      });

      // If in demo mode, user is already created
      if (isDemoMode()) {
        demoModeAPI.setCurrentUser(user.id);
        apiClient.setToken(`demo_token_${user.id}`);
        onLoginSuccess(user);
        return;
      }

      // Try to login with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (signInError) throw signInError;

      if (data.session?.access_token) {
        apiClient.setToken(data.session.access_token);
        const { user: userData } = await apiClient.getCurrentUser();
        onLoginSuccess(userData);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || t('signupError'));
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
        <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start mb-4 gap-2">
            <div className="flex-1" />
            <div className="bg-gradient-to-r from-primary to-secondary p-3 sm:p-4 rounded-full">
              <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <div className="flex-1 flex justify-end">
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="w-[120px] sm:w-[140px] h-9">
                  <SelectValue>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-base sm:text-lg">{getLanguageFlag(language)}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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
          </div>
          <CardTitle className="text-2xl sm:text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            EduConnect
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">{t('welcomeMessage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signup')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Alert className="mb-4 border-lime-500 bg-lime-50 dark:bg-lime-950/20">
                <BookOpen className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                <AlertDescription className="text-xs text-lime-800 dark:text-lime-300">
                  <div className="space-y-1">
                    <p className="font-semibold mb-2">Cuentas de prueba:</p>
                    <div className="space-y-1">
                      <div><strong>Admin:</strong> admin / EduConnect@Admin2024</div>
                      <div><strong>Profesor:</strong> teacher@demo.com / demo123</div>
                      <div><strong>Estudiante:</strong> student@demo.com / demo123</div>
                    </div>
                    <p className="mt-2 text-muted-foreground italic text-[11px]">
                      O crea una nueva cuenta en la pestaña "Registro"
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
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                        signupRole === 'student'
                          ? 'border-secondary bg-cyan-50 dark:bg-cyan-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-secondary" />
                      <span className="text-xs sm:text-sm">{t('student')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupRole('teacher')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                        signupRole === 'teacher'
                          ? 'border-primary bg-lime-50 dark:bg-lime-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-primary" />
                      <span className="text-xs sm:text-sm">{t('teacher')}</span>
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
      </div>
    </div>
  );
}
