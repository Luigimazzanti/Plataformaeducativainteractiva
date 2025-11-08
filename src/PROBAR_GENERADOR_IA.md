# 🧪 Cómo Probar el Generador de Preguntas con IA de Gemini

## ✅ Pasos para Probar

### 1️⃣ Iniciar Sesión
```
Email: teacher@demo.com
Password: demo123
```

### 2️⃣ Navegar al Generador
- Click en la pestaña **"Materiales"** en el dashboard
- Busca el botón **"✨ Generar Preguntas"**
- Se abrirá el diálogo del generador

### 3️⃣ Pegar Texto de Prueba

Usa uno de estos textos de ejemplo:

#### Ejemplo 1: Ciencias 🔬
```
La fotosíntesis es el proceso bioquímico mediante el cual las plantas, algas y algunas bacterias convierten la luz solar en energía química. Este proceso ocurre principalmente en los cloroplastos, orgánulos celulares que contienen clorofila, el pigmento verde responsable de capturar la luz. Durante la fotosíntesis, las plantas absorben dióxido de carbono del aire a través de los estomas en sus hojas, y agua del suelo mediante sus raíces. Utilizando la energía lumínica, estos componentes se transforman en glucosa, un azúcar simple que sirve como fuente de energía, y oxígeno, que se libera a la atmósfera como subproducto. La fotosíntesis es fundamental para la vida en la Tierra, ya que no solo produce el oxígeno que respiramos, sino que también forma la base de la mayoría de las cadenas alimentarias.
```

#### Ejemplo 2: Historia 📚
```
La Revolución Francesa fue un período de profundo cambio político y social en Francia que comenzó en 1789 y terminó aproximadamente en 1799. Este acontecimiento histórico marcó el fin del absolutismo monárquico y el nacimiento de la república en Francia. La revolución comenzó con la toma de la Bastilla el 14 de julio de 1789, símbolo de la opresión real. Los revolucionarios proclamaron la Declaración de los Derechos del Hombre y del Ciudadano, estableciendo principios de libertad, igualdad y fraternidad. El rey Luis XVI fue ejecutado en 1793, seguido por el período conocido como el Terror, liderado por Maximilien Robespierre. La revolución influyó profundamente en el desarrollo político moderno, inspirando movimientos democráticos en todo el mundo y estableciendo principios que aún hoy guían a muchas naciones.
```

#### Ejemplo 3: Geografía 🌍
```
El río Amazonas es el río más caudaloso del mundo y el segundo más largo después del Nilo. Se encuentra en América del Sur y atraviesa varios países, principalmente Brasil, pero también Perú, Colombia y otros. El Amazonas tiene aproximadamente 6,400 kilómetros de longitud y su cuenca hidrográfica abarca más de 7 millones de kilómetros cuadrados. La selva amazónica que rodea el río es considerada el pulmón del planeta, ya que produce aproximadamente el 20% del oxígeno de la Tierra. El río alberga una biodiversidad extraordinaria, con miles de especies de peces, aves, mamíferos y plantas. El Amazonas desemboca en el océano Atlántico, donde descarga aproximadamente 209,000 metros cúbicos de agua por segundo. Esta región es vital para el equilibrio ecológico global y enfrenta amenazas constantes de deforestación y cambio climático.
```

### 4️⃣ Configurar Opciones
- **Incluir completar blancos:** ✅ ON (recomendado)
- **Máximo de preguntas:** 20 (recomendado para pruebas)

### 5️⃣ Generar Preguntas
1. Click en el botón **"Generar Preguntas"**
2. Espera 3-10 segundos (verás un spinner de carga)
3. ¡Las preguntas aparecerán automáticamente!

### 6️⃣ Verificar Resultados

Deberías ver:
- ✅ Aproximadamente 20 preguntas generadas
- ✅ Diferentes tipos de preguntas (definición, propiedad, ubicación, temporal, completar)
- ✅ Cada pregunta tiene un badge de color según su tipo
- ✅ Respuestas claras y concisas
- ✅ Toast notification de éxito

### 7️⃣ Probar Funcionalidades Adicionales

**Copiar preguntas individuales:**
- Click en el ícono de copiar al lado de cada pregunta
- Verás una confirmación ✅

**Exportar:**
- Click en botón **"TXT"** para exportar como texto plano
- Click en botón **"JSON"** para exportar como JSON estructurado

**Usar preguntas:**
- Click en **"Usar estas preguntas"** para integrarlas en tu flujo de trabajo

---

## 🎯 Qué Esperar

### Preguntas de Definición
Ejemplo: "¿Qué es la fotosíntesis?"
Badge: Azul

### Preguntas de Propiedad
Ejemplo: "¿Qué contienen los cloroplastos?"
Badge: Verde

### Preguntas de Ubicación
Ejemplo: "¿Dónde ocurre la fotosíntesis?"
Badge: Morado

### Preguntas Temporales
Ejemplo: "¿Cuándo comenzó la Revolución Francesa?"
Badge: Naranja

### Preguntas de Completar
Ejemplo: "Completa: El río Amazonas desemboca en el océano _______"
Badge: Rosa

### Preguntas de Identificar
Ejemplo: "¿Quién lideró el período del Terror?"
Badge: Cian

---

## ⚡ Rendimiento Esperado

- **Tiempo de respuesta:** 3-10 segundos
- **Calidad:** Alta (generadas por Gemini AI)
- **Cantidad:** Hasta 50 preguntas (según configuración)
- **Variedad:** 6 tipos diferentes de preguntas

---

## 🔍 Verificación de Calidad

Las preguntas generadas deben:
1. ✅ Estar directamente relacionadas con el texto
2. ✅ Ser gramaticalmente correctas
3. ✅ Tener respuestas precisas
4. ✅ Cubrir diferentes aspectos del contenido
5. ✅ Ser educativas y relevantes

---

## 🐛 Resolución de Problemas

### No se generan preguntas
- Verifica que el texto tenga al menos 50 caracteres
- Asegúrate de tener conexión a internet
- Intenta con un texto más estructurado

### Error 401
- Vuelve a iniciar sesión
- El token puede haber expirado

### Error 429
- Espera 1-2 minutos
- Has alcanzado el límite de solicitudes temporalmente

### Preguntas de baja calidad
- Usa texto más detallado y estructurado
- Incluye información específica (fechas, nombres, lugares)
- Evita fragmentos o listas sin contexto

---

## 📊 Comparación con Sistema Anterior

### Antes (Reglas Programáticas)
```
Texto: "Madrid es la capital de España"
Pregunta: "¿Qué es Madrid?"
Respuesta: "la capital de España"
```
❌ Básico, limitado, sin contexto

### Ahora (IA de Gemini)
```
Texto: "Madrid es la capital de España y cuenta con más de 3 millones de habitantes"
Preguntas:
1. "¿Qué es Madrid en relación con España?"
2. "¿Cuántos habitantes tiene Madrid?"
3. "¿Cuál es la capital de España?"
```
✅ Inteligente, variado, con contexto

---

## ✨ Consejos para Mejores Resultados

1. **Usa textos informativos:** Artículos, extractos de libros, contenido educativo
2. **Longitud ideal:** 100-500 palabras
3. **Contenido estructurado:** Oraciones completas, párrafos bien formados
4. **Información específica:** Incluye datos, fechas, nombres, lugares
5. **Temas claros:** Define bien el tema que estás abordando

---

## 🎓 Casos de Uso Reales

### Para Profesores:
- Generar cuestionarios rápidamente
- Crear evaluaciones basadas en lecturas
- Preparar preguntas para exámenes
- Revisar comprensión de textos

### Para Estudiantes (si tienen acceso):
- Autoevaluación
- Preparación para exámenes
- Práctica de comprensión lectora
- Estudio independiente

---

## 📞 Soporte

Si necesitas ayuda:
1. Revisa esta guía completa
2. Consulta `/GENERADOR_IA_GEMINI_IMPLEMENTADO.md` para detalles técnicos
3. Verifica los logs del navegador (F12 → Console)
4. Prueba con diferentes textos

---

## ✅ Checklist de Prueba Completa

- [ ] Iniciar sesión como teacher@demo.com
- [ ] Abrir el generador de preguntas
- [ ] Pegar texto de prueba (usar ejemplo de Ciencias)
- [ ] Configurar opciones (20 preguntas, completar blancos ON)
- [ ] Generar preguntas
- [ ] Verificar que aparecen ~20 preguntas
- [ ] Revisar calidad de las preguntas
- [ ] Copiar una pregunta individual
- [ ] Exportar a TXT
- [ ] Exportar a JSON
- [ ] Probar con texto de Historia
- [ ] Probar con texto de Geografía
- [ ] Verificar diferentes tipos de preguntas (badges de colores)

---

## 🎉 ¡Listo!

Ahora tienes todo lo necesario para probar el nuevo generador de preguntas con IA de Gemini.

**¡Disfruta generando preguntas educativas de alta calidad automáticamente! ✨**
