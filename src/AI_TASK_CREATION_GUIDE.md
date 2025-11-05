# Guía de Creación de Tareas con IA

## Nueva Funcionalidad Implementada

Se ha agregado la capacidad de configurar el **nivel de español** y la **dificultad** al generar tareas con IA. Esta configuración solo es visible para los profesores y no se muestra a los estudiantes.

## Características

### Nivel de Español
Los profesores pueden seleccionar entre 4 niveles:
- **A1-A2 (Básico)**: Vocabulario simple y oraciones cortas
- **B1-B2 (Intermedio)**: Vocabulario moderado y estructuras gramaticales variadas
- **C1-C2 (Avanzado)**: Vocabulario sofisticado y estructuras complejas
- **Estándar**: Nivel estándar de español

### Dificultad
Los profesores pueden elegir entre 3 niveles de dificultad:
- **Fácil**: Preguntas básicas y directas
- **Normal**: Equilibrio entre preguntas básicas y analíticas
- **Difícil**: Preguntas complejas y de análisis profundo

## Privacidad de la Configuración

✅ **Solo visible para profesores**: 
- Los niveles de español y dificultad se guardan como metadata
- Esta información solo aparece en la vista del profesor
- Los estudiantes solo ven la tarea generada final

## Cómo Usar

1. Haz clic en **"Crear con IA"** en el panel del profesor
2. Selecciona el **Nivel de Español** deseado
3. Selecciona la **Dificultad** deseada
4. Elige el tipo de contenido (Texto, PDF, Imagen o Video)
5. Proporciona el contenido fuente
6. Haz clic en **"Generar Tarea"**
7. Revisa la tarea generada (puedes editarla si es necesario)
8. Genera el PDF y asigna a los estudiantes

## Solución de Problemas

Si recibes el error **"Error al generar con IA: Request failed"**, verifica:

1. **Conexión a Internet**: Asegúrate de tener una conexión estable
2. **Servidor Activo**: Verifica que el servidor Edge Function esté desplegado
3. **API Key de OpenAI**: Confirma que la variable de entorno `OPENAI_API_KEY` esté configurada
4. **Logs del Servidor**: Revisa la consola del navegador (F12) para más detalles del error

### Logs Útiles
El sistema ahora incluye logs detallados:
- En el navegador: Abre la consola (F12 → Console)
- En el servidor: Los logs de OpenAI se muestran en tiempo real

## Ejemplos de Uso

### Ejemplo 1: Tarea para Estudiantes Principiantes
- **Nivel**: A1-A2 (Básico)
- **Dificultad**: Fácil
- **Resultado**: Preguntas simples con vocabulario básico

### Ejemplo 2: Tarea para Estudiantes Avanzados
- **Nivel**: C1-C2 (Avanzado)
- **Dificultad**: Difícil
- **Resultado**: Preguntas complejas con análisis crítico

### Ejemplo 3: Tarea Estándar
- **Nivel**: Estándar
- **Dificultad**: Normal
- **Resultado**: Preguntas balanceadas para nivel general

## Notas Técnicas

- La IA utiliza GPT-4o para imágenes y GPT-4o-mini para otros tipos de contenido
- Los metadatos se guardan en el campo `metadata` de la tarea
- El PDF generado no incluye los metadatos (solo el contenido de la tarea)
