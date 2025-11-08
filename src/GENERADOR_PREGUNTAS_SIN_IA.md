# 🎯 GENERADOR DE PREGUNTAS SIN IA

## ✨ Funcionalidad Nueva Implementada

Se ha agregado un **Generador de Preguntas Inteligente** que crea cuestionarios automáticamente a partir de texto, **SIN usar inteligencia artificial, NLP ni APIs externas**. Solo usa expresiones regulares y reglas programáticas.

---

## 📍 Ubicación

**Dashboard del Profesor** → Botón **"Generar Preguntas"** (icono de ⚡ chispa)

El botón se encuentra junto al botón "Nueva Tarea" en la sección de tareas.

---

## 🚀 Cómo Usar

### Paso 1: Abrir el Generador

1. Inicia sesión como profesor (teacher@demo.com / demo123)
2. En el dashboard, haz clic en **"Generar Preguntas"**
3. Se abrirá un diálogo con un área de texto

### Paso 2: Ingresar el Texto

Pega o escribe el texto del que quieres generar preguntas. Ejemplo:

```
Madrid es la capital de España. El idioma oficial de España es el español. 
España tiene más de 47 millones de habitantes. Madrid se encuentra en el 
centro de la península ibérica. La monarquía española fue restaurada en 1975.
```

### Paso 3: Configurar Opciones

- **Incluir completar blancos**: Genera preguntas de tipo "Completa: ________ es la capital de España"
- **Máximo de preguntas**: Selecciona 10, 20, 30 o 50 preguntas

### Paso 4: Generar

Haz clic en **"Generar Preguntas"** y espera ~300ms mientras se procesan las preguntas.

### Paso 5: Revisar y Exportar

- **Ver preguntas**: Scroll por la lista de preguntas generadas
- **Copiar individual**: Clic en el icono de copiar
- **Exportar TXT**: Descarga en formato texto plano
- **Exportar JSON**: Descarga en formato JSON para procesamiento
- **Usar preguntas**: Integra directamente en la plataforma (próximamente)

---

## 🎓 Patrones Detectados

El generador reconoce automáticamente estos patrones en el texto:

### 1. Definición ("X es Y")
**Texto:** "Madrid es la capital de España"
**Pregunta:** ¿Qué es Madrid?
**Respuesta:** la capital de España
**Tipo:** Definición

### 2. Propiedad ("X tiene Y")
**Texto:** "España tiene más de 47 millones de habitantes"
**Pregunta:** ¿Qué tiene España?
**Respuesta:** más de 47 millones de habitantes
**Tipo:** Propiedad

### 3. Ubicación ("X está en Y")
**Texto:** "Madrid se encuentra en el centro de la península ibérica"
**Pregunta:** ¿Dónde se encuentra Madrid?
**Respuesta:** en el centro de la península ibérica
**Tipo:** Ubicación

### 4. Temporal ("X ocurrió en Y")
**Texto:** "La monarquía española fue restaurada en 1975"
**Pregunta:** ¿Cuándo fue restaurada la monarquía española?
**Respuesta:** en 1975
**Tipo:** Temporal

### 5. Identificación ("X se llama Y")
**Texto:** "El río principal de España se llama Tajo"
**Pregunta:** ¿Cómo se llama el río principal de España?
**Respuesta:** Tajo
**Tipo:** Identificar

### 6. Completar Blancos
**Texto:** "Madrid es la capital de España"
**Pregunta:** Completa: ________ es la capital de España
**Respuesta:** Madrid
**Tipo:** Completar

---

## 📊 Tipos de Preguntas

El sistema categoriza automáticamente las preguntas en 6 tipos:

1. **Definición** (azul) - "¿Qué es X?"
2. **Propiedad** (verde) - "¿Qué tiene X?"
3. **Ubicación** (púrpura) - "¿Dónde está X?"
4. **Temporal** (naranja) - "¿Cuándo ocurrió X?"
5. **Completar** (rosa) - "Completa: ________"
6. **Identificar** (cian) - "¿Cómo se llama X?"

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Historia

**Texto de entrada:**
```
La Segunda Guerra Mundial comenzó en 1939. Adolf Hitler fue el líder de Alemania. 
La guerra terminó en 1945. El Día D ocurrió en Normandía. Los Aliados fueron 
Estados Unidos, Reino Unido y la Unión Soviética.
```

**Preguntas generadas:**
1. ¿Cuándo comenzó La Segunda Guerra Mundial? → en 1939 (Temporal)
2. ¿Qué fue Adolf Hitler? → el líder de Alemania (Identificar)
3. ¿Cuándo terminó la guerra? → en 1945 (Temporal)
4. ¿Dónde ocurrió El Día D? → en Normandía (Ubicación)
5. ¿Qué fueron Los Aliados? → Estados Unidos, Reino Unido y la Unión Soviética (Definición)

### Ejemplo 2: Geografía

**Texto de entrada:**
```
El río Amazonas es el más largo del mundo. Brasil tiene la mayor parte de la 
selva amazónica. Manaus se encuentra en el corazón de la Amazonía. La selva 
contiene millones de especies de plantas y animales.
```

**Preguntas generadas:**
1. ¿Qué es El río Amazonas? → el más largo del mundo (Definición)
2. ¿Qué tiene Brasil? → la mayor parte de la selva amazónica (Propiedad)
3. ¿Dónde se encuentra Manaus? → en el corazón de la Amazonía (Ubicación)
4. ¿Qué contiene La selva? → millones de especies de plantas y animales (Propiedad)

### Ejemplo 3: Ciencia

**Texto de entrada:**
```
El ADN contiene información genética. Los cromosomas se encuentran en el núcleo 
celular. La fotosíntesis ocurre en las plantas. El agua está compuesta por 
hidrógeno y oxígeno.
```

**Preguntas generadas:**
1. ¿Qué contiene El ADN? → información genética (Propiedad)
2. ¿Dónde se encuentran Los cromosomas? → en el núcleo celular (Ubicación)
3. ¿Dónde ocurre La fotosíntesis? → en las plantas (Ubicación)
4. Completa: El ________ está compuesta por hidrógeno y oxígeno (Completar)

---

## ⚙️ Funcionamiento Técnico

### Sin IA, Solo Regex

El generador usa **expresiones regulares** para detectar patrones:

```javascript
// Ejemplo: Detectar "X es Y"
const pattern = /^(.+?)\s+es\s+(.+?)$/i;
const match = sentence.match(pattern);
// Si coincide: "Madrid es la capital de España"
// match[1] = "Madrid"
// match[2] = "la capital de España"
```

### Patrones Implementados

El sistema detecta **10 patrones diferentes**:

1. `X es/son/era/eran Y`
2. `X tiene/tienen/posee/poseen Y`
3. `X fue/fueron Y`
4. `X se llama/llaman/denomina Y`
5. `X está/están en Y`
6. `X ocurrió/sucedió/comenzó/terminó en Y`
7. `X contiene/contienen/incluye Y`
8. `X se encuentra/encuentran Y`
9. `X pertenece/pertenecen a Y`
10. `X forma/forman Y`

### Validaciones

- **Mínimo de palabras**: Oraciones de al menos 4 palabras
- **Sujetos válidos**: Evita artículos solos
- **Respuestas válidas**: Evita respuestas genéricas como "sí", "no"
- **Eliminación de duplicados**: Preguntas únicas

### Generación de Completar Blancos

```javascript
// Detecta palabras clave (nombres propios, números, conceptos)
const keywordPatterns = [
  /^[A-Z][a-záéíóúñ]+$/, // Nombres propios
  /^\d+$/, // Números
  /^(capital|idioma|país|ciudad)$/i // Conceptos
];

// Omite la palabra y crea "________"
```

---

## 📥 Formatos de Exportación

### JSON (para procesamiento automático)

```json
[
  {
    "id": "q-1",
    "pregunta": "¿Qué es Madrid?",
    "respuesta": "la capital de España",
    "tipo": "definicion",
    "oracionOriginal": "Madrid es la capital de España"
  },
  {
    "id": "q-2",
    "pregunta": "¿Qué tiene España?",
    "respuesta": "más de 47 millones de habitantes",
    "tipo": "propiedad",
    "oracionOriginal": "España tiene más de 47 millones de habitantes"
  }
]
```

### TXT (para impresión o lectura)

```
1. ¿Qué es Madrid?
   Respuesta: la capital de España

2. ¿Qué tiene España?
   Respuesta: más de 47 millones de habitantes

3. ¿Dónde se encuentra Madrid?
   Respuesta: en el centro de la península ibérica
```

---

## 🎯 Consejos para Mejores Resultados

### ✅ Textos que Funcionan Bien

- Oraciones bien estructuradas con sujeto + verbo + complemento
- Definiciones claras: "X es Y"
- Hechos concretos: "X ocurrió en Y"
- Descripciones: "X tiene Y", "X contiene Y"
- Ubicaciones: "X está en Y"

### ❌ Textos que No Funcionan Bien

- Oraciones muy cortas (menos de 4 palabras)
- Preguntas en el texto original
- Texto sin estructura gramatical clara
- Poesía o prosa literaria compleja
- Diálogos o conversaciones

### 💡 Optimización del Texto

**Malo:**
```
Madrid. Capital. España. Habitantes: 47M.
```

**Bueno:**
```
Madrid es la capital de España. España tiene 47 millones de habitantes.
```

**Malo:**
```
¿Sabías que Madrid es genial? Sí, lo es. Muy bonita.
```

**Bueno:**
```
Madrid es la capital de España. Madrid se encuentra en el centro de la península ibérica.
```

---

## 📊 Estadísticas en Tiempo Real

El generador muestra estadísticas automáticamente:

- **Total de preguntas generadas**
- **Cantidad por tipo** (Definición: 5, Ubicación: 3, etc.)
- **Promedio de longitud** de preguntas y respuestas

---

## 🔮 Funcionalidades Futuras

### Próximamente

1. **Crear tarea directamente** desde las preguntas generadas
2. **Editar preguntas** antes de exportar
3. **Mezclar preguntas** aleatoriamente
4. **Opciones múltiples** generadas automáticamente
5. **Importar desde PDF** con extracción de texto
6. **Plantillas de cuestionarios** predefinidas

---

## 🛠️ API del Generador

Si quieres usar el generador programáticamente:

```javascript
import { 
  generateQuestionsFromText,
  exportQuestionsToJSON,
  exportQuestionsToText,
  getQuestionStats
} from '../utils/question-generator';

// Generar preguntas
const questions = generateQuestionsFromText(miTexto, {
  maxQuestions: 20,
  includeCompletarBlancos: true,
  minWords: 4
});

// Exportar a JSON
const json = exportQuestionsToJSON(questions);

// Exportar a texto
const txt = exportQuestionsToText(questions);

// Obtener estadísticas
const stats = getQuestionStats(questions);
console.log(stats.total); // 15
console.log(stats.porTipo); // { definicion: 5, ubicacion: 3, ... }
```

---

## 📝 Estructura de una Pregunta

```typescript
interface Question {
  id: string;                 // "q-1", "q-2", etc.
  pregunta: string;           // "¿Qué es Madrid?"
  respuesta: string;          // "la capital de España"
  tipo: string;               // "definicion", "ubicacion", etc.
  oracionOriginal: string;    // Oración completa del texto
}
```

---

## 🎓 Casos de Uso Educativos

### Para Profesores

1. **Crear cuestionarios rápidos** a partir de apuntes de clase
2. **Evaluar comprensión lectora** con preguntas del libro de texto
3. **Generar ejercicios** a partir de presentaciones
4. **Crear exámenes** combinando múltiples textos

### Para Estudiantes

1. **Auto-evaluación** creando preguntas de sus apuntes
2. **Repaso activo** generando cuestionarios de estudio
3. **Preparación de exámenes** con preguntas de los temas

---

## ⚡ Rendimiento

- **Velocidad**: ~300ms para textos de 500 palabras
- **Máximo recomendado**: 50 preguntas por generación
- **Textos largos**: Se recomienda dividir en secciones
- **Sin límite de uso**: Funciona completamente offline

---

## 🔒 Privacidad

- ✅ **100% local** - No envía datos a ningún servidor
- ✅ **Sin IA externa** - No usa APIs de OpenAI, Google, etc.
- ✅ **Sin tracking** - No registra ni almacena el texto
- ✅ **Offline capable** - Funciona sin conexión

---

## 🐛 Limitaciones Conocidas

1. **Idioma**: Optimizado para español (puede funcionar parcialmente en otros idiomas)
2. **Gramática**: Requiere oraciones bien formadas
3. **Contexto**: No entiende contexto semántico (solo patrones sintácticos)
4. **Nombres propios**: Mejor con nombres que empiezan con mayúscula
5. **Oraciones complejas**: Funciona mejor con oraciones simples

---

## 🔧 Resolución de Problemas

### "No se pudieron generar preguntas"

**Causas posibles:**
- Texto demasiado corto
- Oraciones sin estructura clara
- Falta de patrones reconocibles

**Solución:**
- Usa oraciones completas con sujeto + verbo + complemento
- Añade más información factual
- Revisa que haya definiciones claras

### "Preguntas duplicadas"

El sistema elimina duplicados automáticamente, pero si ves preguntas muy similares:

**Solución:**
- Varía la estructura de las oraciones en el texto original
- Evita repetir información de la misma manera

### "Respuestas incompletas"

Si las respuestas parecen cortadas:

**Solución:**
- Usa puntos al final de cada oración
- Evita oraciones con múltiples comas
- Separa ideas en oraciones diferentes

---

## 📚 Recursos Adicionales

- **Archivo principal**: `/utils/question-generator.ts`
- **Componente UI**: `/components/QuestionGeneratorDialog.tsx`
- **Integración**: `/components/TeacherDashboard.tsx`

---

## 🎉 Conclusión

El Generador de Preguntas es una herramienta poderosa que permite crear cuestionarios en segundos, **sin depender de IA externa**. Es rápido, privado y fácil de usar.

**Pruébalo ahora:**
1. Login como profesor: teacher@demo.com / demo123
2. Haz clic en "Generar Preguntas" ⚡
3. Pega un texto de ejemplo
4. ¡Genera tu primer cuestionario!

---

**Versión:** 1.0.0
**Fecha:** 2024-11-07
**Estado:** ✅ Implementado y funcionando
