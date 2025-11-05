import { useState, useEffect } from 'react';
import { createClient } from './utils/supabase/client';
import { apiClient } from './utils/api';
import { LoginForm } from './components/LoginForm';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ThemeProvider } from './utils/ThemeContext';
import { LanguageProvider, useLanguage } from './utils/LanguageContext';
import { Toaster } from './components/ui/sonner';
import { enableDemoMode, isDemoMode } from './utils/demo-mode';
import { projectId } from './utils/supabase/info';

function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gradient-from via-gradient-via to-gradient-to">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverChecked, setServerChecked] = useState(false);

  useEffect(() => {
    // First check if server is available
    checkServerAvailability();
  }, []);

  const checkServerAvailability = async () => {
    try {
      console.log('[EduConnect] Verificando disponibilidad del servidor...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased to 5 seconds

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-05c2b65f/health`,
        { method: 'GET', signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('[EduConnect] ✅ Servidor disponible - Todas las funciones activas');
      } else {
        console.log('[EduConnect] ⚠️ Servidor respondió con error, activando modo demo');
        enableDemoMode();
      }
    } catch (error: any) {
      console.log('[EduConnect] ⚠️ Servidor no disponible:', error.message);
      console.log('[EduConnect] Activando modo demo (sin IA ni subida de archivos)');
      enableDemoMode();
    } finally {
      setServerChecked(true);
      checkSession();
    }
  };

  const checkSession = async () => {
    try {
      // Skip Supabase session check if in demo mode
      if (isDemoMode()) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        apiClient.setToken(session.access_token);
        try {
          const { user: userData } = await apiClient.getCurrentUser();
          
          // Load avatar from localStorage if available
          const savedAvatar = localStorage.getItem(`user_avatar_${userData.id}`);
          if (savedAvatar) {
            userData.avatar = savedAvatar;
          }
          
          setUser(userData);
        } catch (error: any) {
          // If getCurrentUser fails, clear the session
          console.error('Error loading user:', error);
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    // Load avatar from localStorage if available
    const savedAvatar = localStorage.getItem(`user_avatar_${userData.id}`);
    if (savedAvatar) {
      userData.avatar = savedAvatar;
    }
    setUser(userData);
  };

  const handleUpdateProfile = (updates: any) => {
    setUser((prevUser: any) => ({
      ...prevUser,
      ...updates
    }));
  };

  const handleLogout = async () => {
    if (!isDemoMode()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    apiClient.setToken(null);
    setUser(null);
  };

  if (isLoading || !serverChecked) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <LoadingScreen />
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        {!user ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        ) : user.role === 'admin' ? (
          <AdminDashboard user={user} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} />
        ) : user.role === 'teacher' ? (
          <TeacherDashboard user={user} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} />
        ) : (
          <StudentDashboard user={user} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} />
        )}
        <Toaster />
      </LanguageProvider>
    </ThemeProvider>
  );
}
