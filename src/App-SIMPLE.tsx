import { useState, useEffect, useRef } from "react";
import { apiClient } from "./utils/api";
import { AuthManager, initializeAuth } from "./utils/auth-manager";
import { LoginForm } from "./components/LoginForm";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ThemeProvider } from "./utils/ThemeContext";
import { LanguageProvider, useLanguage } from "./utils/LanguageContext";
import { Toaster } from "./components/ui/sonner";
import { enableDemoMode, isDemoMode, demoModeAPI } from "./utils/demo-mode";
import { projectId } from "./utils/api";

function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gradient-from via-gradient-via to-gradient-to">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Solo ejecutar UNA VEZ
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log('%c[EduConnect] Iniciando aplicación...', 'color: #84cc16; font-weight: bold;');

    // Inicializar auth
    initializeAuth();

    // Verificar modo demo
    if (projectId === "DEMO_MODE" || projectId === "TU_PROJECT_ID_AQUI" || !projectId) {
      console.log("[EduConnect] ⚡ Modo demo activado");
      enableDemoMode();
      setIsLoading(false);
      return;
    }

    // Intentar restaurar sesión
    const token = AuthManager.getToken();
    if (token) {
      apiClient.setToken(token);
      apiClient.getCurrentUser()
        .then(response => {
          if (response?.user?.id) {
            const userData = response.user;
            AuthManager.saveUserId(userData.id);
            
            // Cargar avatar
            const savedAvatar = localStorage.getItem(`user_avatar_${userData.id}`);
            if (savedAvatar) {
              userData.avatar = savedAvatar;
            }
            
            console.log('[EduConnect] ✅ Sesión restaurada');
            setUser(userData);
          }
        })
        .catch(error => {
          console.log('[EduConnect] Token inválido, limpiando sesión');
          AuthManager.clearAll();
          apiClient.setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLoginSuccess = (userData: any) => {
    const savedAvatar = localStorage.getItem(`user_avatar_${userData.id}`);
    if (savedAvatar) {
      userData.avatar = savedAvatar;
    }
    setUser(userData);
  };

  const handleUpdateProfile = (updates: any) => {
    setUser((prevUser: any) => ({
      ...prevUser,
      ...updates,
    }));
  };

  const handleLogout = async () => {
    if (isDemoMode()) {
      await demoModeAPI.logout();
    }
    AuthManager.clearAll();
    console.log('[EduConnect] ✅ Sesión cerrada');
    setUser(null);
  };

  if (isLoading) {
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
        <div className="overflow-x-hidden w-full min-h-screen">
          {!user ? (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          ) : user.role === "admin" ? (
            <AdminDashboard
              user={user}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          ) : user.role === "teacher" ? (
            <TeacherDashboard
              user={user}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          ) : (
            <StudentDashboard
              user={user}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
          <Toaster />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
