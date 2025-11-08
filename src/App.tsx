import { useState, useEffect } from "react";
import { apiClient } from "./utils/api";
import { AuthManager, initializeAuth } from "./utils/auth-manager";
import { LoginForm } from "./components/LoginForm";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ThemeProvider } from "./utils/ThemeContext";
import {
  LanguageProvider,
  useLanguage,
} from "./utils/LanguageContext";
import { Toaster } from "./components/ui/sonner";
import { enableDemoMode, isDemoMode } from "./utils/demo-mode";
import { projectId } from "./utils/api";
import { CACHE_BUSTER_ID } from "./CACHE_BUSTER_V9.js";

// ═══════════════════════════════════════════════════════════════════════════
// VERSION DE BUILD - FORZAR RECOMPILACION NUCLEAR
// ═══════════════════════════════════════════════════════════════════════════
const EDUCONNECT_BUILD_VERSION = "9.4.0-QUESTION-GENERATOR-INTEGRATED-20241107";
const SUPABASE_CLIENT_REMOVED = true; // Frontend ahora usa solo fetch nativo
const BACKEND_AUTH_ENDPOINTS = ["/login", "/signup"]; // Nuevos endpoints agregados
const WINDOW_FETCH_FORCED = true; // ✅ window.fetch() forzado en todo el frontend
const BACKEND_URL_FIXED = true; // 🔧 CRÍTICO: /server/ no /gemini-handler/
const FAST_LOGIN_ENABLED = true; // ⚡ Login optimizado: 1.5s timeout, delays reducidos
const QUESTION_GENERATOR_ACTIVE = true; // ✨ Generador de preguntas sin IA integrado
// ═══════════════════════════════════════════════════════════════════════════

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
  /*
   * ╔═══════════════════════════════════════════════════════════════════════╗
   * ║  FORZANDO RECOMPILACION NUCLEAR - VERSION FINAL V9                    ║
   * ║  ELIMINACION COMPLETA DE SUPABASE JS DEL FRONTEND                     ║
   * ║  FECHA: 2024-11-07                                                    ║
   * ║  CAMBIOS CRITICOS:                                                    ║
   * ║  - Cliente Supabase eliminado del frontend                            ║
   * ║  - Uso exclusivo de fetch nativo del navegador                        ║
   * ║  - Nuevos endpoints /login y /signup en backend                       ║
   * ║  - AuthManager como unica fuente de tokens                            ║
   * ║  - Este comentario invalida cache del bundler de Figma Make           ║
   * ╚═══════════════════════════════════════════════════════════════════════╝
   */
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverChecked, setServerChecked] = useState(false);

  useEffect(() => {
    // Log de versión para verificar recompilación
    console.log(`%c[EduConnect] Build Version: ${EDUCONNECT_BUILD_VERSION}`, 'color: #84cc16; font-weight: bold;');
    console.log(`%c[EduConnect] Cache Buster ID: ${CACHE_BUSTER_ID}`, 'color: #3b82f6; font-weight: bold;');
    console.log(`%c[EduConnect] Supabase Client Removed: ${SUPABASE_CLIENT_REMOVED}`, 'color: #10b981;');
    console.log(`%c[EduConnect] ⚡ Window.Fetch Forced: ${WINDOW_FETCH_FORCED}`, 'color: #f59e0b; font-weight: bold; font-size: 14px;');
    console.log(`%c[EduConnect] 🔧 Backend URL Fixed: ${BACKEND_URL_FIXED} (/server/ not /gemini-handler/)`, 'color: #ef4444; font-weight: bold; font-size: 14px;');
    console.log(`%c[EduConnect] ✅ Usando window.fetch nativo en TODO el frontend`, 'color: #10b981;');
    
    // Inicializar sistema de autenticación y restaurar token si existe
    initializeAuth();
    
    // First check if server is available
    checkServerAvailability();
  }, []);

  const checkServerAvailability = async () => {
    try {
      console.log(
        "[EduConnect] Verificando disponibilidad del servidor...",
      );
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        1500,
      ); // Reduced to 1.5 seconds for faster demo mode activation

      // Usar window.fetch explícitamente para evitar conflictos con polyfills
      const response = await window.fetch(
        `https://${projectId}.supabase.co/functions/v1/server/make-server-05c2b65f/health`,
        { method: "GET", signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(
          "[EduConnect] ✅ Servidor disponible - Todas las funciones activas",
        );
        // Ensure demo mode is disabled if server is available
        localStorage.removeItem('educonnect_demo_mode');
      } else {
        console.log(
          "[EduConnect] ⚠️ Servidor respondió con error, activando modo demo",
        );
        enableDemoMode();
      }
    } catch (error: any) {
      console.log(
        "[EduConnect] ⚠️ Servidor no disponible:",
        error.message,
      );
      console.log(
        "[EduConnect] ⚡ Activando modo demo rápido (login optimizado)",
      );
      enableDemoMode();
    } finally {
      setServerChecked(true);
      checkSession();
    }
  };

  const checkSession = async () => {
    try {
      // Skip session check if in demo mode
      if (isDemoMode()) {
        setIsLoading(false);
        return;
      }

      // Check if we have a valid token in AuthManager
      const token = AuthManager.getToken();
      
      if (token) {
        apiClient.setToken(token);
        
        try {
          const { user: userData } = await apiClient.getCurrentUser();

          // Guardar user ID
          AuthManager.saveUserId(userData.id);

          // Load avatar from localStorage if available
          const savedAvatar = localStorage.getItem(
            `user_avatar_${userData.id}`,
          );
          if (savedAvatar) {
            userData.avatar = savedAvatar;
          }

          console.log('[App] ✅ Sesión restaurada desde AuthManager');
          setUser(userData);
        } catch (error: any) {
          // If getCurrentUser fails, clear the session
          console.error("Error loading user:", error);
          AuthManager.clearAll();
          apiClient.setToken(null);
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    // Load avatar from localStorage if available
    const savedAvatar = localStorage.getItem(
      `user_avatar_${userData.id}`,
    );
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
    if (!isDemoMode()) {
      // No longer using Supabase client in frontend
    }
    // Limpiar todos los datos de autenticación con AuthManager
    AuthManager.clearAll();
    console.log('[App] ✅ Sesión cerrada, token eliminado');
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
