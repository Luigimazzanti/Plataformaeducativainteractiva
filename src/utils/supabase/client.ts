import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// URL de tu proyecto Supabase
const supabaseUrl = `https://${projectId}.supabase.co`;

// Crear cliente de Supabase con manejo de errores
let supabaseClient: any = null;

try {
  supabaseClient = createClient(supabaseUrl, publicAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  console.log('✅ [Supabase] Cliente creado correctamente');
} catch (error) {
  console.error('❌ [Supabase] Error creando cliente:', error);
}

// Exportar el cliente de Supabase
export const supabase = supabaseClient;

// Nombre del bucket para archivos de tareas
export const ASSIGNMENTS_BUCKET = 'assignment-files';

/**
 * Subir archivo a Supabase Storage
 * @param file - Archivo a subir
 * @param folder - Carpeta dentro del bucket (opcional)
 * @returns URL pública del archivo
 */
export async function uploadFileToStorage(file: File, folder: string = 'pdfs'): Promise<{
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}> {
  try {
    console.log('📤 [Supabase Storage] Subiendo archivo:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // 🔍 VALIDAR: Cliente de Supabase disponible
    if (!supabase) {
      console.error('❌ [Supabase Storage] Cliente no disponible');
      throw new Error('SUPABASE_CLIENT_NOT_AVAILABLE');
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomId}.${fileExtension}`;

    console.log('📝 [Supabase Storage] Nombre del archivo:', fileName);

    // 🔧 Subir archivo al bucket
    try {
      const { data, error } = await supabase.storage
        .from(ASSIGNMENTS_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        // 🔧 ARREGLO: No mostrar error si es RLS (esperado en modo demo)
        const isRLSError = error.message?.includes('row-level security') || 
                          error.message?.includes('RLS') ||
                          error.message?.includes('policy');
        
        if (!isRLSError) {
          console.error('❌ [Supabase Storage] Error subiendo archivo:', error);
        }
        throw error;
      }

      console.log('✅ [Supabase Storage] Archivo subido:', data);

      // Obtener URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from(ASSIGNMENTS_BUCKET)
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      console.log('✅ [Supabase Storage] URL pública:', publicUrl);

      return {
        id: randomId,
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    } catch (uploadError: any) {
      throw uploadError;
    }
  } catch (error: any) {
    // 🔧 ARREGLO: No mostrar logs de error si es RLS (esperado en modo demo)
    const isRLSError = error.message?.includes('row-level security') || 
                      error.message?.includes('RLS') ||
                      error.message?.includes('policy');
    
    if (!isRLSError) {
      console.error('❌ [Supabase Storage] Error completo:', error);
    }
    
    // Mensajes de error más específicos
    if (error.message === 'SUPABASE_CLIENT_NOT_AVAILABLE') {
      throw new Error('El cliente de Supabase no está configurado correctamente');
    } else if (error.message === 'UPLOAD_ABORTED') {
      throw new Error('La subida del archivo fue cancelada. Esto puede deberse a:\n• Problemas de red\n• Configuración incorrecta de Supabase Storage\n• El bucket no existe o no tiene permisos');
    } else if (error.statusCode === '404') {
      throw new Error(`El bucket "${ASSIGNMENTS_BUCKET}" no existe en Supabase Storage`);
    } else if (isRLSError) {
      // 🔧 Lanzar error silencioso de RLS
      throw new Error('RLS_ERROR');
    }
    
    throw new Error(`Error subiendo archivo: ${error.message || error}`);
  }
}

/**
 * Eliminar archivo de Supabase Storage
 * @param filePath - Ruta del archivo en el bucket
 */
export async function deleteFileFromStorage(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(ASSIGNMENTS_BUCKET)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    console.log('✅ [Supabase Storage] Archivo eliminado:', filePath);
  } catch (error: any) {
    console.error('❌ [Supabase Storage] Error eliminando archivo:', error);
    throw new Error(`Error eliminando archivo: ${error.message}`);
  }
}

/**
 * Descargar archivo de Supabase Storage
 * @param filePath - Ruta del archivo en el bucket
 * @returns Blob del archivo
 */
export async function downloadFileFromStorage(filePath: string): Promise<Blob> {
  try {
    const { data, error } = await supabase.storage
      .from(ASSIGNMENTS_BUCKET)
      .download(filePath);

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('❌ [Supabase Storage] Error descargando archivo:', error);
    throw new Error(`Error descargando archivo: ${error.message}`);
  }
}