// ═══════════════════════════════════════════════════════════════════════════
// 🔍 SCRIPT DE DIAGNÓSTICO RÁPIDO PARA EDUCONNECT
// ═══════════════════════════════════════════════════════════════════════════
// 
// CÓMO USAR:
// 1. Abre la consola del navegador (F12 en Windows, Cmd+Option+I en Mac)
// 2. Copia TODO este archivo
// 3. Pégalo en la consola y presiona Enter
// 4. Lee los resultados
//
// ═══════════════════════════════════════════════════════════════════════════

(async function diagnosticoEduConnect() {
  console.clear();
  console.log('%c═══════════════════════════════════════════════════════', 'color: #84cc16; font-weight: bold;');
  console.log('%c   🔍 DIAGNÓSTICO EDUCONNECT                           ', 'color: #84cc16; font-weight: bold;');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #84cc16; font-weight: bold;');
  console.log('');

  // 1. Verificar localStorage
  console.log('%c📦 1. VERIFICANDO LOCALSTORAGE...', 'color: #3b82f6; font-weight: bold;');
  const token = localStorage.getItem('educonnect_token');
  const userId = localStorage.getItem('educonnect_user_id');
  const demoMode = localStorage.getItem('educonnect_demo_mode');
  
  console.log('   Token:', token ? '✅ Presente (' + token.substring(0, 20) + '...)' : '❌ No encontrado');
  console.log('   User ID:', userId ? '✅ ' + userId : '❌ No encontrado');
  console.log('   Demo Mode:', demoMode ? '✅ Activado' : '❌ Desactivado');
  console.log('');

  // 2. Verificar conectividad al backend
  console.log('%c🌐 2. VERIFICANDO BACKEND...', 'color: #3b82f6; font-weight: bold;');
  const projectId = 'ldhimtgexjbmwobkmcwr';
  const backendUrl = `https://${projectId}.supabase.co/functions/v1/server/make-server-05c2b65f/health`;
  
  console.log('   URL:', backendUrl);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const startTime = Date.now();
    const response = await fetch(backendUrl, {
      method: 'GET',
      signal: controller.signal
    });
    const endTime = Date.now();
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`   ✅ Backend DISPONIBLE (${endTime - startTime}ms)`);
      console.log('   ℹ️  Deberías poder usar todas las funcionalidades');
    } else {
      console.log(`   ⚠️  Backend respondió con error: ${response.status}`);
      console.log('   ℹ️  Modo demo se activará automáticamente');
    }
  } catch (error) {
    console.log('   ❌ Backend NO DISPONIBLE');
    console.log('   Error:', error.message);
    console.log('   ℹ️  Modo demo se activará automáticamente');
  }
  console.log('');

  // 3. Verificar estado del usuario actual
  console.log('%c👤 3. VERIFICANDO SESIÓN ACTUAL...', 'color: #3b82f6; font-weight: bold;');
  if (token && userId) {
    console.log('   ✅ Sesión encontrada');
    console.log('   User ID:', userId);
    console.log('   Token:', token.substring(0, 30) + '...');
    
    if (userId === 'admin') {
      console.log('   👑 ROL: Administrador');
    } else if (userId.includes('teacher')) {
      console.log('   👨‍🏫 ROL: Profesor');
    } else if (userId.includes('student')) {
      console.log('   👨‍🎓 ROL: Estudiante');
    }
  } else {
    console.log('   ❌ No hay sesión activa');
    console.log('   ℹ️  Debes hacer login');
  }
  console.log('');

  // 4. Verificar navegador y capacidades
  console.log('%c🌐 4. VERIFICANDO NAVEGADOR...', 'color: #3b82f6; font-weight: bold;');
  console.log('   Navegador:', navigator.userAgent.split(' ').slice(-2).join(' '));
  console.log('   localStorage:', typeof(Storage) !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
  console.log('   fetch:', typeof(fetch) !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
  console.log('   window.fetch:', typeof(window.fetch) !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
  console.log('');

  // 5. Recomendaciones
  console.log('%c💡 5. RECOMENDACIONES', 'color: #f59e0b; font-weight: bold;');
  
  const recomendaciones = [];
  
  if (!token && !userId) {
    recomendaciones.push('   🔸 DEBES hacer login primero');
    recomendaciones.push('   🔸 Usa: teacher@demo.com / demo123');
  }
  
  if (demoMode !== 'true') {
    recomendaciones.push('   🔸 El modo demo NO está activado');
    recomendaciones.push('   🔸 Si el backend no está disponible, se activará automáticamente al hacer login');
  }
  
  if (token && userId && !demoMode) {
    recomendaciones.push('   🔸 Tienes una sesión pero el modo demo no está activo');
    recomendaciones.push('   🔸 Esto puede causar errores si el backend no está desplegado');
  }
  
  if (recomendaciones.length === 0) {
    console.log('   ✅ Todo se ve bien');
  } else {
    recomendaciones.forEach(r => console.log(r));
  }
  console.log('');

  // 6. Acciones rápidas
  console.log('%c⚡ 6. ACCIONES RÁPIDAS', 'color: #10b981; font-weight: bold;');
  console.log('');
  console.log('%c   🔧 OPCIÓN 1: Limpiar todo y recargar', 'color: #3b82f6;');
  console.log('   localStorage.clear(); location.reload();');
  console.log('');
  console.log('%c   🔧 OPCIÓN 2: Forzar modo demo y recargar', 'color: #3b82f6;');
  console.log('   localStorage.setItem("educonnect_demo_mode", "true"); location.reload();');
  console.log('');
  console.log('%c   🔧 OPCIÓN 3: Logout manual', 'color: #3b82f6;');
  console.log('   localStorage.removeItem("educonnect_token"); localStorage.removeItem("educonnect_user_id"); location.reload();');
  console.log('');

  // 7. Resumen final
  console.log('%c═══════════════════════════════════════════════════════', 'color: #84cc16; font-weight: bold;');
  console.log('%c   📋 RESUMEN', 'color: #84cc16; font-weight: bold;');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #84cc16; font-weight: bold;');
  console.log('');
  
  if (!token && !userId) {
    console.log('%c   ❌ NO HAY SESIÓN ACTIVA', 'color: #ef4444; font-weight: bold;');
    console.log('   ℹ️  Necesitas hacer login con credenciales demo:');
    console.log('   📧 Email: teacher@demo.com');
    console.log('   🔑 Password: demo123');
  } else if (demoMode === 'true') {
    console.log('%c   ✅ MODO DEMO ACTIVO', 'color: #10b981; font-weight: bold;');
    console.log('   ℹ️  La aplicación está funcionando en modo demo');
    console.log('   ⚠️  Subida de archivos no disponible');
  } else {
    console.log('%c   ⚠️  SESIÓN ACTIVA PERO MODO DEMO NO CONFIRMADO', 'color: #f59e0b; font-weight: bold;');
    console.log('   ℹ️  Puede haber problemas si el backend no está disponible');
  }
  
  console.log('');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #84cc16; font-weight: bold;');
  console.log('');
  
  // Devolver objeto con resultados
  return {
    token: !!token,
    userId: userId,
    demoMode: demoMode === 'true',
    diagnosticoCompleto: true
  };
})();

console.log('');
console.log('%c💡 TIP: Puedes ejecutar las acciones rápidas copiando y pegando los comandos de arriba', 'color: #10b981;');
console.log('');
