/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GENERADOR DE PREGUNTAS SIN IA - Solo Reglas Programáticas
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Genera preguntas de cuestionario a partir de texto usando expresiones
 * regulares y patrones lingüísticos. NO usa IA, NLP ni APIs externas.
 * 
 * Patrones detectados:
 * - "X es Y" → "¿Qué es X?"
 * - "X tiene Y" → "¿Qué tiene X?"
 * - "X fue Y" → "¿Qué fue X?"
 * - "X se llama Y" → "¿Cómo se llama X?"
 * - "X está en Y" → "¿Dónde está X?"
 * - "X ocurrió en Y" → "¿Cuándo ocurrió X?"
 * - Completar blancos (omite palabras clave)
 */

export interface Question {
  id: string;
  pregunta: string;
  respuesta: string;
  tipo: 'definicion' | 'propiedad' | 'ubicacion' | 'temporal' | 'completar' | 'identificar';
  oracionOriginal: string;
}

export interface QuestionGeneratorOptions {
  maxQuestions?: number;
  includeCompletarBlancos?: boolean;
  minWords?: number; // Mínimo de palabras para considerar una oración
}

/**
 * Genera preguntas a partir de un texto
 */
export function generateQuestionsFromText(
  text: string,
  options: QuestionGeneratorOptions = {}
): Question[] {
  const {
    maxQuestions = 50,
    includeCompletarBlancos = true,
    minWords = 4
  } = options;

  // Normalizar el texto
  const normalizedText = text
    .replace(/\s+/g, ' ') // Espacios múltiples
    .replace(/\n+/g, '. ') // Saltos de línea
    .trim();

  // Dividir en oraciones
  const sentences = normalizedText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => {
      const wordCount = s.split(/\s+/).length;
      return s.length > 0 && wordCount >= minWords;
    });

  const questions: Question[] = [];
  let questionId = 1;

  for (const sentence of sentences) {
    // Aplicar cada patrón de detección
    const generatedQuestions = [
      ...detectEsPattern(sentence),
      ...detectTienePattern(sentence),
      ...detectFuePattern(sentence),
      ...detectSeLlamaPattern(sentence),
      ...detectEstaEnPattern(sentence),
      ...detectOcurrioEnPattern(sentence),
      ...detectContienePattern(sentence),
      ...detectSeEncuentraPattern(sentence),
      ...detectPertenecePattern(sentence),
      ...detectFormaPattern(sentence),
    ];

    // Añadir preguntas generadas con ID único
    for (const q of generatedQuestions) {
      questions.push({
        ...q,
        id: `q-${questionId++}`,
        oracionOriginal: sentence
      });
    }

    // Generar preguntas de completar blancos si está habilitado
    if (includeCompletarBlancos) {
      const fillInQuestions = generateFillInTheBlank(sentence);
      for (const q of fillInQuestions) {
        questions.push({
          ...q,
          id: `q-${questionId++}`,
          oracionOriginal: sentence
        });
      }
    }

    // Limitar número de preguntas
    if (questions.length >= maxQuestions) {
      break;
    }
  }

  // Eliminar duplicados
  const uniqueQuestions = removeDuplicates(questions);

  return uniqueQuestions.slice(0, maxQuestions);
}

/**
 * Detecta patrón "X es Y"
 * Ejemplo: "Madrid es la capital de España" → "¿Qué es Madrid?"
 */
function detectEsPattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  // Patrón principal: "X es Y"
  const patterns = [
    /^(.+?)\s+es\s+(.+?)$/i,
    /^(.+?)\s+son\s+(.+?)$/i,
    /^(.+?)\s+era\s+(.+?)$/i,
    /^(.+?)\s+eran\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿Qué es ${subject}?`,
          respuesta: answer,
          tipo: 'definicion'
        });
      }
    }
  }

  return questions;
}

/**
 * Detecta patrón "X tiene Y"
 */
function detectTienePattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const patterns = [
    /^(.+?)\s+tiene\s+(.+?)$/i,
    /^(.+?)\s+tienen\s+(.+?)$/i,
    /^(.+?)\s+posee\s+(.+?)$/i,
    /^(.+?)\s+poseen\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿Qué tiene ${subject}?`,
          respuesta: answer,
          tipo: 'propiedad'
        });
      }
    }
  }

  return questions;
}

/**
 * Detecta patrón "X fue Y"
 */
function detectFuePattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const patterns = [
    /^(.+?)\s+fue\s+(.+?)$/i,
    /^(.+?)\s+fueron\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿Qué fue ${subject}?`,
          respuesta: answer,
          tipo: 'identificar'
        });
      }
    }
  }

  return questions;
}

/**
 * Detecta patrón "X se llama Y"
 */
function detectSeLlamaPattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const patterns = [
    /^(.+?)\s+se\s+llama\s+(.+?)$/i,
    /^(.+?)\s+se\s+llaman\s+(.+?)$/i,
    /^(.+?)\s+se\s+denomina\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿Cómo se llama ${subject}?`,
          respuesta: answer,
          tipo: 'identificar'
        });
      }
    }
  }

  return questions;
}

/**
 * Detecta patrón "X está en Y"
 */
function detectEstaEnPattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const patterns = [
    /^(.+?)\s+está\s+en\s+(.+?)$/i,
    /^(.+?)\s+están\s+en\s+(.+?)$/i,
    /^(.+?)\s+se\s+encuentra\s+en\s+(.+?)$/i,
    /^(.+?)\s+se\s+encuentran\s+en\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿Dónde está ${subject}?`,
          respuesta: answer,
          tipo: 'ubicacion'
        });
      }
    }
  }

  return questions;
}

/**
 * Detecta patrón temporal "X ocurrió en Y"
 */
function detectOcurrioEnPattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const patterns = [
    /^(.+?)\s+ocurrió\s+en\s+(.+?)$/i,
    /^(.+?)\s+sucedió\s+en\s+(.+?)$/i,
    /^(.+?)\s+tuvo\s+lugar\s+en\s+(.+?)$/i,
    /^(.+?)\s+comenzó\s+en\s+(.+?)$/i,
    /^(.+?)\s+terminó\s+en\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿Cuándo ocurrió ${subject}?`,
          respuesta: answer,
          tipo: 'temporal'
        });
      }
    }
  }

  return questions;
}

/**
 * Detecta patrón "X contiene Y"
 */
function detectContienePattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const patterns = [
    /^(.+?)\s+contiene\s+(.+?)$/i,
    /^(.+?)\s+contienen\s+(.+?)$/i,
    /^(.+?)\s+incluye\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿Qué contiene ${subject}?`,
          respuesta: answer,
          tipo: 'propiedad'
        });
      }
    }
  }

  return questions;
}

/**
 * Detecta patrón "X se encuentra Y"
 */
function detectSeEncuentraPattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const pattern = /^(.+?)\s+se\s+encuentra\s+(.+?)$/i;
  const match = sentence.match(pattern);
  
  if (match) {
    const subject = match[1].trim();
    const answer = match[2].trim();
    
    if (isValidSubject(subject) && isValidAnswer(answer)) {
      questions.push({
        pregunta: `¿Dónde se encuentra ${subject}?`,
        respuesta: answer,
        tipo: 'ubicacion'
      });
    }
  }

  return questions;
}

/**
 * Detecta patrón "X pertenece a Y"
 */
function detectPertenecePattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const patterns = [
    /^(.+?)\s+pertenece\s+a\s+(.+?)$/i,
    /^(.+?)\s+pertenecen\s+a\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿A qué pertenece ${subject}?`,
          respuesta: answer,
          tipo: 'propiedad'
        });
      }
    }
  }

  return questions;
}

/**
 * Detecta patrón "X forma Y"
 */
function detectFormaPattern(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  
  const patterns = [
    /^(.+?)\s+forma\s+(.+?)$/i,
    /^(.+?)\s+forman\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const subject = match[1].trim();
      const answer = match[2].trim();
      
      if (isValidSubject(subject) && isValidAnswer(answer)) {
        questions.push({
          pregunta: `¿Qué forma ${subject}?`,
          respuesta: answer,
          tipo: 'propiedad'
        });
      }
    }
  }

  return questions;
}

/**
 * Genera preguntas de completar blancos
 * Omite sustantivos, verbos principales y números
 */
function generateFillInTheBlank(sentence: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];
  const words = sentence.split(/\s+/);
  
  // Solo generar para oraciones no muy cortas ni muy largas
  if (words.length < 5 || words.length > 20) {
    return questions;
  }

  // Palabras clave que son buenos candidatos para omitir
  const keywordPatterns = [
    /^[A-Z][a-záéíóúñ]+$/, // Nombres propios (empiezan con mayúscula)
    /^\d+$/, // Números
    /^(capital|idioma|país|ciudad|rey|presidente|autor|inventor|científico)$/i,
  ];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Verificar si la palabra es un buen candidato
    const isKeyword = keywordPatterns.some(pattern => pattern.test(word));
    
    if (isKeyword && word.length > 3) {
      // Crear versión con blank
      const sentenceWithBlank = words
        .map((w, idx) => idx === i ? '________' : w)
        .join(' ');
      
      questions.push({
        pregunta: `Completa: ${sentenceWithBlank}`,
        respuesta: word,
        tipo: 'completar'
      });
      
      // Solo generar una pregunta de completar por oración
      break;
    }
  }

  return questions;
}

/**
 * Valida si el sujeto es válido
 */
function isValidSubject(subject: string): boolean {
  if (!subject || subject.length < 2) return false;
  
  // Evitar sujetos que son solo artículos o preposiciones
  const invalidStarts = ['el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'unos ', 'unas '];
  const lowerSubject = subject.toLowerCase();
  
  // Permitir si tiene sustantivo después del artículo
  if (invalidStarts.some(start => lowerSubject === start.trim())) {
    return false;
  }
  
  return true;
}

/**
 * Valida si la respuesta es válida
 */
function isValidAnswer(answer: string): boolean {
  if (!answer || answer.length < 2) return false;
  
  // Evitar respuestas demasiado cortas o genéricas
  const invalidAnswers = ['sí', 'no', 'tal vez', 'quizás', 'si', 'bien', 'mal'];
  
  return !invalidAnswers.includes(answer.toLowerCase());
}

/**
 * Elimina preguntas duplicadas o muy similares
 */
function removeDuplicates(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const unique: Question[] = [];

  for (const q of questions) {
    // Crear clave única basada en la pregunta normalizada
    const key = q.pregunta?.toLowerCase().replace(/\s+/g, ' ').trim();
    
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  }

  return unique;
}

/**
 * Exporta preguntas a formato JSON
 */
export function exportQuestionsToJSON(questions: Question[]): string {
  return JSON.stringify(questions, null, 2);
}

/**
 * Exporta preguntas a formato de texto plano
 */
export function exportQuestionsToText(questions: Question[]): string {
  return questions
    .map((q, index) => {
      return `${index + 1}. ${q.pregunta}\n   Respuesta: ${q.respuesta}\n`;
    })
    .join('\n');
}

/**
 * Estadísticas sobre las preguntas generadas
 */
export interface QuestionStats {
  total: number;
  porTipo: Record<string, number>;
  promedioLongitudPregunta: number;
  promedioLongitudRespuesta: number;
}

export function getQuestionStats(questions: Question[]): QuestionStats {
  const stats: QuestionStats = {
    total: questions.length,
    porTipo: {},
    promedioLongitudPregunta: 0,
    promedioLongitudRespuesta: 0,
  };

  let totalLengthPreguntas = 0;
  let totalLengthRespuestas = 0;

  for (const q of questions) {
    // Contar por tipo
    stats.porTipo[q.tipo] = (stats.porTipo[q.tipo] || 0) + 1;
    
    // Sumar longitudes
    totalLengthPreguntas += q.pregunta.length;
    totalLengthRespuestas += q.respuesta.length;
  }

  if (questions.length > 0) {
    stats.promedioLongitudPregunta = Math.round(totalLengthPreguntas / questions.length);
    stats.promedioLongitudRespuesta = Math.round(totalLengthRespuestas / questions.length);
  }

  return stats;
}
