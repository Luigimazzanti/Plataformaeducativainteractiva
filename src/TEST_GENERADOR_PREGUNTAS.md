# ✅ TEST DEL GENERADOR DE PREGUNTAS

## Checklist de Verificación

Sigue estos pasos para verificar que el generador funciona correctamente:

---

## ✅ PASO 1: Acceso al Generador

- [ ] Login con `teacher@demo.com` / `demo123`
- [ ] Estás en el dashboard del profesor
- [ ] Ves la pestaña "Tareas" (ya seleccionada por defecto)
- [ ] Ves el botón **"Generar Preguntas"** con icono ✨
- [ ] El botón está a la izquierda de "Nueva Tarea"
- [ ] El botón tiene borde verde lima

---

## ✅ PASO 2: Abrir el Diálogo

- [ ] Click en **"Generar Preguntas"**
- [ ] Se abre un diálogo modal grande
- [ ] Ves el título "✨ Generador de Preguntas Inteligente"
- [ ] Ves la descripción "Genera preguntas automáticamente..."
- [ ] Ves un área de texto grande con placeholder
- [ ] Ves el contador de palabras (inicialmente "0 palabras")
- [ ] Ves dos opciones: Switch "Incluir completar blancos" y selector "Máximo"
- [ ] Ves el botón "Generar Preguntas" deshabilitado (sin texto)

---

## ✅ PASO 3: Ingresar Texto

Copia y pega este texto de prueba:

```
Madrid es la capital de España. El idioma oficial de España es el español. España tiene más de 47 millones de habitantes. Madrid se encuentra en el centro de la península ibérica.
```

Verifica:
- [ ] El texto se pega correctamente
- [ ] El contador muestra "~35 palabras"
- [ ] El botón "Generar Preguntas" se habilita
- [ ] El switch está activado por defecto
- [ ] El selector muestra "20 preguntas"

---

## ✅ PASO 4: Generar Preguntas

- [ ] Click en **"Generar Preguntas"**
- [ ] Ves un spinner (loading) por ~300ms
- [ ] Aparece un toast verde: "✅ X preguntas generadas exitosamente"
- [ ] Aparece una sección de estadísticas azul
- [ ] Ves "Total: X preguntas" (debería ser 6-8)
- [ ] Ves desglose por tipo (ej: "Definición: 3", "Ubicación: 1", etc.)

---

## ✅ PASO 5: Revisar Preguntas

Verifica que las preguntas generadas sean similares a:

- [ ] **#1 [Definición]** - "¿Qué es Madrid?" → "la capital de España"
- [ ] **#2 [Definición]** - "¿Qué es El idioma oficial de España?" → "el español"
- [ ] **#3 [Propiedad]** - "¿Qué tiene España?" → "más de 47 millones de habitantes"
- [ ] **#4 [Ubicación]** - "¿Dónde se encuentra Madrid?" → "en el centro de la península ibérica"

Verifica formato:
- [ ] Cada pregunta tiene un número (#1, #2, etc.)
- [ ] Cada pregunta tiene un badge de tipo con color
- [ ] Cada pregunta tiene la pregunta en negrita
- [ ] Cada pregunta tiene "Respuesta: ..." debajo
- [ ] Cada pregunta tiene un botón de copiar (📋)

---

## ✅ PASO 6: Copiar Pregunta

- [ ] Click en el icono de copiar (📋) de la primera pregunta
- [ ] El icono cambia a ✓ verde por 2 segundos
- [ ] Aparece un toast: "Pregunta copiada"
- [ ] Pega en un editor de texto para verificar
- [ ] El formato es: "¿Qué es Madrid?\nRespuesta: la capital de España"

---

## ✅ PASO 7: Exportar TXT

- [ ] Click en botón **"TXT"** arriba a la derecha
- [ ] Se descarga un archivo `cuestionario-[timestamp].txt`
- [ ] Abre el archivo descargado
- [ ] Verifica que contiene todas las preguntas numeradas
- [ ] Formato es legible y listo para imprimir

Formato esperado:
```
1. ¿Qué es Madrid?
   Respuesta: la capital de España

2. ¿Qué es El idioma oficial de España?
   Respuesta: el español
```

---

## ✅ PASO 8: Exportar JSON

- [ ] Click en botón **"JSON"** arriba a la derecha
- [ ] Se descarga un archivo `cuestionario-[timestamp].json`
- [ ] Abre el archivo en un editor de texto
- [ ] Es JSON válido (puedes validar en jsonlint.com)
- [ ] Contiene array de objetos
- [ ] Cada objeto tiene: id, pregunta, respuesta, tipo, oracionOriginal

Estructura esperada:
```json
[
  {
    "id": "q-1",
    "pregunta": "¿Qué es Madrid?",
    "respuesta": "la capital de España",
    "tipo": "definicion",
    "oracionOriginal": "Madrid es la capital de España"
  }
]
```

---

## ✅ PASO 9: Probar Opciones

### Test A: Desactivar "Completar Blancos"
- [ ] Desactiva el switch "Incluir completar blancos"
- [ ] Ingresa nuevo texto (o usa el mismo)
- [ ] Genera preguntas
- [ ] Verifica que NO hay preguntas tipo "Completa: ________"

### Test B: Cambiar Máximo
- [ ] Selecciona "10 preguntas" en el selector
- [ ] Ingresa un texto largo (usa uno de los ejemplos en /EJEMPLOS_TEXTOS_GENERADOR.txt)
- [ ] Genera preguntas
- [ ] Verifica que genera máximo 10 preguntas

### Test C: Texto Corto
- [ ] Borra todo el texto
- [ ] Escribe solo: "Madrid es la capital."
- [ ] Genera preguntas
- [ ] Debería generar 1-2 preguntas

---

## ✅ PASO 10: Textos de Ejemplo

Prueba con uno de los 12 ejemplos en `/EJEMPLOS_TEXTOS_GENERADOR.txt`:

### Ejemplo Recomendado: Sistema Solar
```
El Sol es una estrella. El Sistema Solar tiene ocho planetas. Mercurio es el planeta más cercano al Sol. Júpiter es el planeta más grande. La Tierra se encuentra en la zona habitable. Marte se llama el planeta rojo.
```

Verifica:
- [ ] Genera ~10-15 preguntas
- [ ] Detecta diferentes tipos (Definición, Propiedad, Ubicación, Identificar)
- [ ] Las respuestas son correctas
- [ ] Las preguntas tienen sentido

---

## ✅ PASO 11: Edge Cases

### Test A: Texto Vacío
- [ ] Borra todo el texto
- [ ] Intenta generar preguntas
- [ ] Aparece toast rojo: "Por favor, ingresa un texto"

### Test B: Texto Sin Patrones
- [ ] Ingresa: "Hola mundo. Adiós. Fin."
- [ ] Genera preguntas
- [ ] Aparece toast amarillo: "No se pudieron generar preguntas..."
- [ ] Muestra consejos para mejores resultados

### Test C: Texto Muy Largo
- [ ] Pega los 12 ejemplos juntos (~2000 palabras)
- [ ] Selecciona "50 preguntas" máximo
- [ ] Genera preguntas
- [ ] Verifica que genera exactamente 50 (o menos si no hay suficientes patrones)

---

## ✅ PASO 12: Responsive (Móvil)

Si tienes acceso a un dispositivo móvil o puedes cambiar el tamaño de la ventana:

- [ ] Reduce el ancho de la ventana a ~400px (móvil)
- [ ] El botón dice solo "Preguntas" (versión corta)
- [ ] El diálogo se adapta al ancho móvil
- [ ] El scroll funciona correctamente
- [ ] Los botones son tocables (no demasiado pequeños)
- [ ] Las preguntas se leen bien

---

## ✅ PASO 13: Cerrar y Reabrir

- [ ] Genera algunas preguntas
- [ ] Cierra el diálogo (botón "Cancelar" o X)
- [ ] Reabre el diálogo
- [ ] El texto anterior NO está (se limpia)
- [ ] Las preguntas anteriores NO están (se limpian)
- [ ] Todo está reseteado

---

## ✅ PASO 14: Múltiples Generaciones

- [ ] Genera preguntas con un texto
- [ ] Sin cerrar el diálogo, cambia el texto
- [ ] Genera preguntas de nuevo
- [ ] Las preguntas viejas se reemplazan por las nuevas
- [ ] Las estadísticas se actualizan

---

## ✅ PASO 15: Performance

Con un texto de ~500 palabras:

- [ ] Pega un texto largo (usa Ejemplo 9: América del Sur)
- [ ] Selecciona "50 preguntas"
- [ ] Nota el tiempo desde que haces click hasta que ves resultados
- [ ] Debería ser menor a 1 segundo
- [ ] La interfaz NO se congela
- [ ] El scroll funciona suavemente

---

## 📊 Resultados Esperados

Si todos los tests pasaron:

✅ **GENERADOR FUNCIONANDO AL 100%**

Número de checks que deberías tener:
- Total de verificaciones: ~70+
- Todas deberían estar ✅

---

## 🐛 Problemas Comunes

### Problema: No veo el botón "Generar Preguntas"
**Solución:**
- Verifica que estás logueado como profesor
- Refresca la página (Ctrl + Shift + R)
- Limpia el caché del navegador

### Problema: No genera preguntas
**Solución:**
- Verifica que el texto tiene oraciones completas
- Usa uno de los ejemplos en `/EJEMPLOS_TEXTOS_GENERADOR.txt`
- Revisa la consola del navegador (F12) por errores

### Problema: Preguntas con mala calidad
**Solución:**
- Usa textos bien estructurados
- Sigue los consejos en `/GENERADOR_PREGUNTAS_SIN_IA.md`
- Evita textos con diálogos o prosa literaria

---

## 📝 Notas

- **Tiempo estimado de test**: 15-20 minutos
- **Navegadores recomendados**: Chrome, Firefox, Safari, Edge
- **Modo demo**: Funciona perfectamente sin backend
- **Privacidad**: No envía datos a ningún servidor

---

## ✅ Confirmación Final

Si completaste todos los pasos:

```
[ ] ✅ Todos los tests pasaron
[ ] ✅ El generador funciona correctamente
[ ] ✅ Entiendo cómo usar la funcionalidad
[ ] ✅ Sé dónde encontrar la documentación
```

---

**¡Felicidades! El Generador de Preguntas está funcionando perfectamente.** 🎉

---

**Fecha de test**: ___________
**Navegador usado**: ___________
**Resultado**: ⭕ PASS / ⭕ FAIL
**Notas adicionales**: ___________________________________________
