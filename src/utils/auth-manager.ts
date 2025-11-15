/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTH MANAGER - RECOMPILACION NUCLEAR V9
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema centralizado de gestión de autenticación y tokens
 * 
 * CAMBIOS CRITICOS EN V9:
 * ✅ Única fuente de verdad para tokens (sin Supabase client)
 * ✅ Persistencia en localStorage con expiración
 * ✅ Sincronización automática con apiClient
 * ✅ Manejo de tokens: admin, demo, y JWT reales
 * 
 * Este módulo maneja:
 * 1. Almacenamiento persistente del token en localStorage
 * 2. Recuperación automática del token al cargar la app
 * 3. Sincronización con apiClient
 * 4. Limpieza del token al cerrar sesión
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { apiClient } from './api';

const TOKEN_STORAGE_KEY = 'educonnect_auth_token';
const TOKEN_EXPIRY_KEY = 'educonnect_auth_token_expiry';
const USER_ID_KEY = 'educonnect_user_id';

export class AuthManager {
  /**
   * Guarda el token de autenticación en localStorage y lo configura en apiClient
   * @param token - JWT token de autenticación
   * @param expiresIn - Tiempo de expiración en segundos (opcional)
   */
  static saveToken(token: string, expiresIn?: number): void {
    try {
      // Guardar token en localStorage
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      
      // Guardar tiempo de expiración si se proporciona
      if (expiresIn) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      
      // Configurar token en apiClient para uso inmediato
      apiClient.setToken(token);
      
      console.log('[AuthManager] ✅ Token guardado y configurado');
    } catch (error) {
      console.error('[AuthManager] ❌ Error guardando token:', error);
    }
  }

  /**
   * Recupera el token guardado y lo configura en apiClient
   * @returns El token si existe y es válido, null si no
   */
  static restoreToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (!token) {
        console.log('[AuthManager] No hay token guardado');
        return null;
      }

      // Verificar si el token ha expirado
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (expiryTime && Date.now() > parseInt(expiryTime)) {
        console.log('[AuthManager] ⚠️ Token expirado, limpiando...');
        this.clearToken();
        return null;
      }

      // Configurar token en apiClient
      apiClient.setToken(token);
      console.log('[AuthManager] ✅ Token restaurado');
      return token;
    } catch (error) {
      console.error('[AuthManager] ❌ Error restaurando token:', error);
      return null;
    }
  }

  /**
   * Limpia el token del localStorage y del apiClient
   */
  static clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      apiClient.setToken(null);
      console.log('[AuthManager] ✅ Token eliminado');
    } catch (error) {
      console.error('[AuthManager] ❌ Error limpiando token:', error);
    }
  }

  /**
   * Verifica si hay un token válido guardado
   * @returns true si hay un token válido, false si no
   */
  static hasValidToken(): boolean {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return false;

    // Verificar expiración
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiryTime && Date.now() > parseInt(expiryTime)) {
      this.clearToken();
      return false;
    }

    return true;
  }

  /**
   * Obtiene el token actual (sin configurarlo en apiClient)
   * @returns El token actual o null
   */
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  /**
   * Guarda el ID del usuario actual
   * @param userId - ID del usuario
   */
  static saveUserId(userId: string): void {
    try {
      localStorage.setItem(USER_ID_KEY, userId);
      console.log('[AuthManager] ✅ User ID guardado:', userId);
    } catch (error) {
      console.error('[AuthManager] ❌ Error guardando user ID:', error);
    }
  }

  /**
   * Obtiene el ID del usuario actual
   * @returns El ID del usuario o null
   */
  static getUserId(): string | null {
    return localStorage.getItem(USER_ID_KEY);
  }

  /**
   * Limpia todos los datos de autenticación
   * IMPORTANTE: Preserva las notificaciones vistas (feedback)
   */
  static clearAll(): void {
    this.clearToken();
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem('educonnect_current_user');
    // NO eliminar educonnect_viewed_feedback_* para preservar notificaciones vistas
    console.log('[AuthManager] ✅ Datos de auth eliminados (notificaciones preservadas)');
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si está autenticado, false si no
   */
  static isAuthenticated(): boolean {
    return this.hasValidToken() && !!this.getUserId();
  }
}

/**
 * Hook de inicialización - Llamar al inicio de la app
 * Restaura el token si existe
 */
export function initializeAuth(): boolean {
  console.log('[AuthManager] Inicializando sistema de autenticación...');
  const token = AuthManager.restoreToken();
  return !!token;
}
