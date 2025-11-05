# 📝 Guía del Editor de PDF Interactivo

## 🎯 Descripción General

EduConnect ahora incluye un potente editor de PDF interactivo que permite a los estudiantes anotar, resaltar, dibujar y escribir directamente sobre los archivos PDF asignados por sus profesores. Este sistema implementa una arquitectura de capas no destructiva que preserva el documento original mientras captura todas las interacciones del estudiante.

## 🏗️ Arquitectura del Sistema

### Flujo de Datos

```
1. Profesor sube PDF → Almacenado en Supabase Storage
2. Estudiante abre PDF → Renderizado con PDF.js
3. Estudiante anota → Anotaciones guardadas como JSON separado
4. Estudiante envía → Sistema fusiona PDF + anotaciones
5. Profesor revisa → Ve PDF con anotaciones integradas
```

### Componentes Clave

#### 1. **PDFAnnotator.tsx**
- Renderiza PDFs usando `pdfjs-dist` (PDF.js)
- Gestiona capa de anotaciones usando Canvas HTML5
- Guardado automático de anotaciones cada vez que se añade una
- Soporte para múltiples páginas con navegación
- Sistema de historial (deshacer/rehacer)

#### 2. **Backend (index.tsx)**
Endpoints implementados:
- `GET /pdf-annotations/:assignmentId` - Obtiene anotaciones guardadas
- `POST /pdf-annotations/:assignmentId` - Guarda capa de anotaciones
- `POST /pdf-submit/:assignmentId` - Envía tarea con PDF anotado
- `GET /pdf-flattened/:submissionId` - Obtiene PDF anotado para revisión

## 🎨 Herramientas Disponibles

### Para Estudiantes

1. **✏️ Texto Libre**
   - Click en cualquier parte del PDF
   - Escribe texto directamente
   - Configurable: tamaño de fuente (8-72px)

2. **🖍️ Resaltado (Highlight)**
   - Click para crear área resaltada
   - Múltiples colores disponibles
   - Transparencia del 40% para preservar texto original

3. **💬 Comentarios**
   - Añade notas adhesivas digitales
   - Icono visual (💬) en el documento
   - Contenido completo almacenado por separado

4. **🖌️ Dibujo a Mano Alzada**
   - Dibuja libremente sobre el documento
   - Útil para fórmulas, marcas, círculos
   - Trazo suave con antialiasing

5. **📐 Figuras Geométricas**
   - Rectángulos: para encuadrar respuestas
   - Círculos: para marcar áreas importantes
   - Grosor de línea: 2px

### Controles Generales

- **Zoom**: 50% - 200% (controles con slider y botones +/-)
- **Deshacer/Rehacer**: Sistema completo de historial
- **Borrar Todo**: Limpia todas las anotaciones
- **Navegación de Páginas**: Soporte multi-página
- **Guardado Automático**: Las anotaciones se guardan automáticamente
- **Guardado Manual**: Botón "Guardar" para guardar explícitamente

## 💾 Persistencia de Datos

### Estructura de Anotaciones (JSON)

```json
{
  "id": "ann-1699876543210",
  "type": "text|highlight|draw|shape|comment",
  "page": 1,
  "x": 150,
  "y": 200,
  "width": 100,
  "height": 20,
  "content": "Texto o comentario",
  "color": "#fbbf24",
  "points": [{"x": 10, "y": 20}, ...],
  "shape": "rectangle|circle",
  "fontSize": 16
}
```

### Almacenamiento en KV Store

```
Key: pdf-annotations:{userId}:{assignmentId}
Value: Array<Annotation>
```

### Flujo de Envío

1. **Guardado de Anotaciones**
   ```typescript
   await kv.set(`pdf-annotations:${userId}:${assignmentId}`, annotations);
   ```

2. **Envío de Tarea**
   ```typescript
   const submission = {
     type: 'pdf-annotated',
     originalPdfUrl: '...',
     annotations: [...],
     submittedAt: '2024-11-04T...'
   };
   ```

3. **Visualización por Profesor**
   - Carga PDF original
   - Superpone anotaciones del estudiante
   - Modo read-only automático

## 🎯 Casos de Uso

### 1. Completar Ejercicios en PDF
Estudiante recibe PDF con ejercicios de matemáticas:
- Usa herramienta de texto para escribir respuestas
- Dibuja fórmulas a mano alzada
- Resalta partes importantes del enunciado

### 2. Análisis de Textos
Estudiante analiza documento literario:
- Resalta metáforas en amarillo
- Resalta personajes en azul
- Añade comentarios con interpretaciones

### 3. Corrección de Documentos
Estudiante revisa un ensayo:
- Dibuja círculos alrededor de errores
- Añade comentarios con correcciones
- Usa rectángulos para marcar párrafos a reescribir

### 4. Problemas de Geometría
Estudiante resuelve problemas:
- Dibuja líneas auxiliares
- Añade medidas con texto
- Marca ángulos con formas

## 🔧 Configuración Técnica

### Librería PDF.js

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Worker configurado automáticamente
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
```

### Renderizado de Páginas

```typescript
const page = await pdfDoc.getPage(pageNum);
const viewport = page.getViewport({ scale: 1.5 });

const renderContext = {
  canvasContext: context,
  viewport: viewport
};

await page.render(renderContext).promise;
```

### Canvas de Anotaciones

El sistema utiliza **dos canvas superpuestos**:
1. **Canvas Base**: Renderiza el PDF original (solo lectura)
2. **Canvas de Anotaciones**: Captura interacciones y renderiza anotaciones

```typescript
<canvas ref={canvasRef} />           {/* PDF Base */}
<canvas ref={annotationCanvasRef} /> {/* Anotaciones */}
```

## 🎨 Paleta de Colores

```typescript
const colors = [
  { name: 'Amarillo', value: '#fbbf24' },  // Resaltador clásico
  { name: 'Verde', value: '#84cc16' },     // Color corporativo
  { name: 'Azul', value: '#3b82f6' },      // Color corporativo
  { name: 'Rojo', value: '#ef4444' },      // Correcciones/errores
  { name: 'Rosa', value: '#ec4899' },      // Énfasis especial
  { name: 'Morado', value: '#a855f7' },    // Notas importantes
  { name: 'Negro', value: '#000000' },     // Texto estándar
];
```

## 📊 Ventajas del Sistema

### ✅ Para Estudiantes
- Experiencia similar a aplicaciones de escritorio
- No necesita descargar/subir archivos
- Guardado automático previene pérdida de trabajo
- Interfaz intuitiva y fácil de usar

### ✅ Para Profesores
- Visualización clara del trabajo del estudiante
- Las anotaciones están perfectamente integradas
- No se modifica el PDF original
- Fácil evaluación y retroalimentación

### ✅ Técnicas
- **No destructivo**: PDF original intacto
- **Eficiente**: Solo se almacena JSON ligero
- **Escalable**: Funciona con PDFs de cualquier tamaño
- **Responsive**: Zoom y navegación fluidos

## 🚀 Mejoras Futuras (Roadmap)

### Fase 2 - Fusión de PDF Real
- Implementar `pdf-lib` para generar PDFs aplanados
- Fusionar anotaciones directamente en el PDF
- Exportar PDF final para descarga

### Fase 3 - Herramientas Avanzadas
- Notas de audio sobre el PDF
- Flechas direccionales
- Formas más complejas (polígonos, estrellas)
- Selector de grosor de línea

### Fase 4 - Colaboración
- Múltiples estudiantes anotando el mismo PDF
- Chat en tiempo real sobre anotaciones
- Versión con revisiones

## 🔒 Seguridad y Privacidad

- Las anotaciones son privadas por estudiante
- Solo el estudiante y su profesor pueden ver las anotaciones
- PDFs almacenados en Supabase Storage con acceso controlado
- URLs firmadas con expiración (1 año por defecto)

## 📱 Compatibilidad

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Tablets con stylus
- ⚠️ Móviles (funcional pero UI optimizada para desktop)

## 💡 Consejos de Uso

### Para Estudiantes
1. Guarda frecuentemente (aunque hay auto-guardado)
2. Usa colores consistentes para tipos de anotaciones
3. Aprovecha el zoom para detalles finos
4. Usa comentarios para explicaciones largas

### Para Profesores
1. Especifica qué tipo de anotaciones esperas (e.g., "resalta las respuestas correctas")
2. Proporciona PDFs con espacio para anotaciones
3. Considera crear PDFs con plantillas para completar

---

## 📞 Soporte

Si encuentras problemas con el editor de PDF:
1. Verifica que el archivo sea un PDF válido
2. Prueba con un zoom diferente
3. Refresca el navegador
4. Consulta TROUBLESHOOTING.md

---

**Versión**: 1.0  
**Última actualización**: Noviembre 2024  
**Desarrollado para**: EduConnect Platform
