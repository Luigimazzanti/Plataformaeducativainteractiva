import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Sparkles, FileText, Upload, Loader2, Check, AlertCircle, Zap, Edit2, Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'matching' | 'likert' | 'yes-no' | 'open-ended';

interface Question {
  id?: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number | boolean | string | string[];
  pairs?: { left: string; right: string }[];
  points?: number;
  explanation?: string;
}

interface QuestionGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestionsGenerated?: (questions: Question[], metadata: {
    taskName: string;
    spanishLevel: string;
    difficulty: string;
  }) => void;
}

const questionTypeOptions = [
  { id: 'multiple-choice', label: 'Opción Múltiple', description: 'Seleccionar entre varias opciones' },
  { id: 'true-false', label: 'Verdadero/Falso', description: 'Determinar si una afirmación es correcta' },
  { id: 'short-answer', label: 'Texto Breve', description: 'Respuesta corta en sus propias palabras' },
  { id: 'matching', label: 'Emparejamiento', description: 'Unir elementos correspondientes' },
  { id: 'likert', label: 'Escala de Likert', description: 'Calificar acuerdo/desacuerdo' },
  { id: 'yes-no', label: 'Dicotómicas (Sí/No)', description: 'Solo dos opciones de respuesta' },
  { id: 'open-ended', label: 'Preguntas Abiertas', description: 'Respuesta libre sin alternativas' },
] as const;

export function QuestionGeneratorDialog({
  open,
  onOpenChange,
  onQuestionsGenerated,
}: QuestionGeneratorDialogProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  const [inputText, setInputText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [taskName, setTaskName] = useState('');
  const [spanishLevel, setSpanishLevel] = useState('B1');
  const [selectedLevel, setSelectedLevel] = useState('B1');
  const [difficulty, setDifficulty] = useState('Medio');
  const [difficultyLevel, setDifficultyLevel] = useState('Medio');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(['multiple-choice']);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['multiple-choice']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para edición de preguntas
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);

  // Funciones para edición de preguntas
  const startEditing = (index: number) => {
    setEditingIndex(index);
    // Crear copia profunda de la pregunta
    setEditedQuestion(JSON.parse(JSON.stringify(questions[index])));
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditedQuestion(null);
  };

  const saveEditing = () => {
    if (editingIndex !== null && editedQuestion) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = editedQuestion;
      setQuestions(updatedQuestions);
      setEditingIndex(null);
      setEditedQuestion(null);
      toast.success('Ejercicio actualizado');
    }
  };

  const updateEditedQuestion = (field: string, value: any) => {
    if (editedQuestion) {
      setEditedQuestion({ ...editedQuestion, [field]: value });
    }
  };

  const updateEditedOption = (optionIndex: number, value: string) => {
    if (editedQuestion && editedQuestion.options) {
      const newOptions = [...editedQuestion.options];
      newOptions[optionIndex] = value;
      setEditedQuestion({ ...editedQuestion, options: newOptions });
    }
  };

  const setCorrectAnswer = (answerIndex: number) => {
    if (editedQuestion) {
      setEditedQuestion({ ...editedQuestion, correctAnswer: answerIndex });
    }
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, idx) => idx !== index);
    setQuestions(updatedQuestions);
    toast.success('Ejercicio eliminado');
  };

  // Función para generar EJERCICIOS PRÁCTICOS (no preguntas teóricas)
  const generateProfessionalELEQuestions = (
    text: string,
    count: number,
    level: string,
    difficultyLevel: string,
    types: QuestionType[]
  ): Question[] => {
    const questions: Question[] = [];
    const cleanText = text.trim();
    const cleanTextLower = cleanText.toLowerCase();
    
    console.log('🔍 [GENERADOR] Analizando texto:', cleanText);
    
    // Detectar si es una CONSIGNA DIDÁCTICA (genera ejercicios de...)
    const isExerciseRequest = /genera|ejercicio|practica|estructura|gramatical/i.test(cleanText);
    console.log('📝 [GENERADOR] ¿Es consigna de ejercicio?', isExerciseRequest);
    
    // Detectar estructuras gramaticales específicas (más flexible)
    const isQuererInfinitivo = /querer.*infinitivo|infinitivo.*querer|querer\s*\+\s*infinitivo/i.test(cleanText);
    const isPresenteSimple = /presente.*simple|presente.*regular|verbos.*regulares|presente.*indicativo/i.test(cleanText);
    
    console.log('🎯 [GENERADOR] Detectado QUERER + INFINITIVO:', isQuererInfinitivo);
    console.log('🎯 [GENERADOR] Detectado PRESENTE SIMPLE:', isPresenteSimple);
    
    // Bancos de datos para ejercicios
    const commonVerbs = ['hablar', 'comer', 'vivir', 'trabajar', 'estudiar', 'viajar', 'escribir', 'leer', 'aprender', 'bailar', 'cantar', 'cocinar', 'nadar', 'correr', 'dormir', 'jugar', 'comprar', 'beber', 'salir', 'descansar'];
    const subjects = [
      { pronoun: 'yo', conjugationIndex: 0 },
      { pronoun: 'tú', conjugationIndex: 1 },
      { pronoun: 'él/ella', conjugationIndex: 2 },
      { pronoun: 'nosotros/as', conjugationIndex: 3 },
      { pronoun: 'vosotros/as', conjugationIndex: 4 },
      { pronoun: 'ellos/as', conjugationIndex: 5 }
    ];
    
    // Conjugaciones de QUERER
    const quererConjugations = ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren'];
    
    // Función para conjugar verbos regulares
    const conjugateRegular = (verb: string, personIndex: number): string => {
      const ending = verb.slice(-2);
      const stem = verb.slice(0, -2);
      const endings: Record<string, string[]> = {
        'ar': ['o', 'as', 'a', 'amos', 'áis', 'an'],
        'er': ['o', 'es', 'e', 'emos', 'éis', 'en'],
        'ir': ['o', 'es', 'e', 'imos', 'ís', 'en']
      };
      return stem + endings[ending][personIndex];
    };
    
    // 🎯 EJERCICIOS DE QUERER + INFINITIVO
    if (isQuererInfinitivo && isExerciseRequest) {
      for (let i = 0; i < count; i++) {
        const questionType = types[i % types.length];
        const verb = commonVerbs[i % commonVerbs.length];
        const subject = subjects[i % subjects.length];
        const subjectName = ['María', 'Carlos', 'Ana', 'Pedro', 'Sofía', 'Luis'][i % 6];
        let question: Question;
        
        switch (questionType) {
          case 'multiple-choice':
            // Ejercicio simple: completar la conjugación
            if (i % 3 === 0) {
              question = {
                id: crypto.randomUUID(),
                type: 'multiple-choice',
                question: `Completa la frase:\n"${subject.pronoun.charAt(0).toUpperCase() + subject.pronoun.slice(1)} _____ ${verb}."`,
                options: [
                  quererConjugations[subject.conjugationIndex],
                  quererConjugations[(subject.conjugationIndex + 1) % 6],
                  quererConjugations[(subject.conjugationIndex + 2) % 6],
                  verb
                ],
                correctAnswer: 0,
                points: 10,
                explanation: `"${subject.pronoun}" → "${quererConjugations[subject.conjugationIndex]} ${verb}"`
              };
            } else if (i % 3 === 1) {
              // Ejercicio: cambiar de sujeto
              const newSubject = subjects[(i + 2) % subjects.length];
              question = {
                id: crypto.randomUUID(),
                type: 'multiple-choice',
                question: `Cambia el sujeto:\n"Yo quiero ${verb}" → "${newSubject.pronoun.charAt(0).toUpperCase() + newSubject.pronoun.slice(1)} _____"`,
                options: [
                  `${quererConjugations[newSubject.conjugationIndex]} ${verb}`,
                  `quiero ${verb}`,
                  `${quererConjugations[(newSubject.conjugationIndex + 1) % 6]} ${verb}`,
                  `querer ${verb}`
                ],
                correctAnswer: 0,
                points: 10,
                explanation: `"${newSubject.pronoun}" → "${quererConjugations[newSubject.conjugationIndex]} ${verb}"`
              };
            } else {
              // Ejercicio: forma negativa
              question = {
                id: crypto.randomUUID(),
                type: 'multiple-choice',
                question: `¿Cómo se forma la negación?\n"${subjectName} quiere ${verb}" → "${subjectName} _____ ${verb}"`,
                options: [
                  'no quiere',
                  'quiere no',
                  'no quiero',
                  'no quier'
                ],
                correctAnswer: 0,
                points: 10,
                explanation: `El "NO" va antes del verbo conjugado: "no quiere ${verb}"`
              };
            }
            break;
            
          case 'short-answer':
            // Ejercicio: completar con la forma correcta
            if (i % 2 === 0) {
              question = {
                id: crypto.randomUUID(),
                type: 'short-answer',
                question: `Completa con la forma correcta:\n"${subject.pronoun.charAt(0).toUpperCase() + subject.pronoun.slice(1)} _____ (querer + ${verb})"`,
                correctAnswer: `${quererConjugations[subject.conjugationIndex]} ${verb}`,
                points: 15,
                explanation: `Respuesta: "${quererConjugations[subject.conjugationIndex]} ${verb}"`
              };
            } else {
              // Ejercicio: traducción
              const englishVerbs: Record<string, string> = {
                'hablar': 'speak', 'comer': 'eat', 'vivir': 'live', 'trabajar': 'work',
                'estudiar': 'study', 'viajar': 'travel', 'escribir': 'write', 'leer': 'read',
                'aprender': 'learn', 'bailar': 'dance', 'cantar': 'sing', 'cocinar': 'cook',
                'nadar': 'swim', 'correr': 'run', 'dormir': 'sleep', 'jugar': 'play',
                'comprar': 'buy', 'beber': 'drink', 'salir': 'go out', 'descansar': 'rest'
              };
              const englishSubjects: Record<number, string> = {
                0: 'I', 1: 'You', 2: 'He/She', 3: 'We', 4: 'You (pl)', 5: 'They'
              };
              question = {
                id: crypto.randomUUID(),
                type: 'short-answer',
                question: `Traduce al español:\n"${englishSubjects[subject.conjugationIndex]} want to ${englishVerbs[verb] || verb}"`,
                correctAnswer: `${quererConjugations[subject.conjugationIndex]} ${verb}`,
                points: 15,
                explanation: `"${englishSubjects[subject.conjugationIndex]} want to ${englishVerbs[verb] || verb}" = "${quererConjugations[subject.conjugationIndex]} ${verb}"`
              };
            }
            break;
            
          case 'matching':
            // Ejercicio: emparejar sujetos con formas correctas
            const v1 = commonVerbs[i % commonVerbs.length];
            const v2 = commonVerbs[(i + 1) % commonVerbs.length];
            const v3 = commonVerbs[(i + 2) % commonVerbs.length];
            question = {
              id: crypto.randomUUID(),
              type: 'matching',
              question: `Empareja cada sujeto con la forma correcta de QUERER + INFINITIVO:`,
              pairs: [
                { left: `Yo / ${v1}`, right: `quiero ${v1}` },
                { left: `Tú / ${v2}`, right: `quieres ${v2}` },
                { left: `Nosotros / ${v3}`, right: `queremos ${v3}` }
              ],
              correctAnswer: ['0-0', '1-1', '2-2'],
              points: 15,
              explanation: `Recuerda: QUERER (conjugado) + INFINITIVO (sin cambios)`
            };
            break;
            
          case 'true-false':
            // Verificar si una frase es correcta
            const isCorrectSentence = i % 2 === 0;
            if (isCorrectSentence) {
              question = {
                id: crypto.randomUUID(),
                type: 'true-false',
                question: `¿Es correcta esta frase?\n"${subjectName} ${quererConjugations[2]} ${verb}."`,
                options: ['Verdadero', 'Falso'],
                correctAnswer: 0,
                points: 10,
                explanation: `Correcto: QUERER + INFINITIVO (mismo sujeto)`
              };
            } else {
              // Frase incorrecta: usa subjuntivo o forma equivocada
              const wrongVerb = conjugateRegular(verb, 2); // forma conjugada (incorrecta)
              question = {
                id: crypto.randomUUID(),
                type: 'true-false',
                question: `¿Es correcta esta frase?\n"${subjectName} quiere ${wrongVerb}." (en lugar de infinitivo)`,
                options: ['Verdadero', 'Falso'],
                correctAnswer: 1,
                points: 10,
                explanation: `Incorrecto. Debe ser "quiere ${verb}" (infinitivo), NO "quiere ${wrongVerb}"`
              };
            }
            break;
            
          case 'open-ended':
            // Ejercicio de producción libre
            if (difficultyLevel === 'Fácil') {
              question = {
                id: crypto.randomUUID(),
                type: 'open-ended',
                question: `Escribe 3 frases usando QUERER + INFINITIVO con:\n• Yo\n• Tú\n• Él/Ella`,
                correctAnswer: 'Respuesta libre',
                points: 20,
                explanation: `Ejemplo: "Yo quiero comer", "Tú quieres bailar", "Ella quiere estudiar"`
              };
            } else if (difficultyLevel === 'Medio') {
              question = {
                id: crypto.randomUUID(),
                type: 'open-ended',
                question: `Traduce al español usando QUERER + INFINITIVO:\n1. I want to travel to Spain\n2. She wants to learn English\n3. We want to eat pizza`,
                correctAnswer: 'Respuesta libre',
                points: 20,
                explanation: `1. Quiero viajar a España\n2. Ella quiere aprender inglés\n3. Queremos comer pizza`
              };
            } else {
              question = {
                id: crypto.randomUUID(),
                type: 'open-ended',
                question: `Escribe 5 frases usando QUERER + INFINITIVO:\n• 2 afirmativas\n• 2 negativas\n• 1 pregunta`,
                correctAnswer: 'Respuesta libre',
                points: 20,
                explanation: `Ejemplos:\n✓ Quiero estudiar / Ella quiere viajar\n✗ No quiero trabajar / Ellos no quieren salir\n❓ ¿Quieres comer?`
              };
            }
            break;
            
          case 'yes-no':
            // Elegir entre dos opciones
            if (i % 2 === 0) {
              question = {
                id: crypto.randomUUID(),
                type: 'yes-no',
                question: `¿Cuál es la forma CORRECTA de la negación?`,
                options: ['No quiero comer', 'Quiero no comer'],
                correctAnswer: 0,
                points: 10,
                explanation: `El "NO" va ANTES de "querer": "No quiero comer"`
              };
            } else {
              question = {
                id: crypto.randomUUID(),
                type: 'yes-no',
                question: `¿Cuál frase usa QUERER + INFINITIVO correctamente?`,
                options: [
                  `Ella quiere ${verb}`,
                  `Ella quiere que ${conjugateRegular(verb, 2)}`
                ],
                correctAnswer: 0,
                points: 10,
                explanation: `QUERER + INFINITIVO: "quiere ${verb}" (mismo sujeto)\nQUERER + QUE + SUBJUNTIVO: "quiere que..." (sujetos diferentes)`
              };
            }
            break;
            
          case 'likert':
            question = {
              id: crypto.randomUUID(),
              type: 'likert',
              question: `Autoevaluación: ¿Qué tan seguro/a te sientes usando QUERER + INFINITIVO?`,
              options: ['Muy inseguro', 'Inseguro', 'Neutral', 'Seguro', 'Muy seguro'],
              correctAnswer: 3,
              points: 5,
              explanation: `Practica con ejemplos: quiero bailar, quieres leer, quiere dormir, queremos viajar`
            };
            break;
            
          default:
            question = {
              id: crypto.randomUUID(),
              type: 'multiple-choice',
              question: `"Ellos _____ estudiar español."`,
              options: ['quieren', 'quiere', 'queremos', 'querer'],
              correctAnswer: 0,
              points: 10,
              explanation: `"Ellos/ellas" → "quieren"`
            };
        }
        
        questions.push(question);
      }
      return questions;
    }
    
    // 🎯 EJERCICIOS DE PRESENTE SIMPLE (verbos regulares)
    if (isPresenteSimple && isExerciseRequest) {
      for (let i = 0; i < count; i++) {
        const questionType = types[i % types.length];
        const verb = commonVerbs[i % commonVerbs.length];
        const subject = subjects[i % subjects.length];
        let question: Question;
        
        switch (questionType) {
          case 'multiple-choice':
            const correct = conjugateRegular(verb, subject.conjugationIndex);
            question = {
              id: crypto.randomUUID(),
              type: 'multiple-choice',
              question: `Conjuga "${verb}" para "${subject.pronoun}":`,
              options: [
                correct,
                conjugateRegular(verb, (subject.conjugationIndex + 1) % 6),
                conjugateRegular(verb, (subject.conjugationIndex + 2) % 6),
                verb
              ],
              correctAnswer: 0,
              points: 10,
              explanation: `"${subject.pronoun} ${correct}"`
            };
            break;
            
          case 'short-answer':
            question = {
              id: crypto.randomUUID(),
              type: 'short-answer',
              question: `Completa: "${subject.pronoun.charAt(0).toUpperCase() + subject.pronoun.slice(1)} _____ (${verb}) todos los días."`,
              correctAnswer: conjugateRegular(verb, subject.conjugationIndex),
              points: 15,
              explanation: `Respuesta: "${conjugateRegular(verb, subject.conjugationIndex)}"`
            };
            break;
            
          case 'matching':
            question = {
              id: crypto.randomUUID(),
              type: 'matching',
              question: `Empareja pronombre + conjugación de "${verb}":`,
              pairs: [
                { left: 'Yo', right: conjugateRegular(verb, 0) },
                { left: 'Tú', right: conjugateRegular(verb, 1) },
                { left: 'Nosotros', right: conjugateRegular(verb, 3) }
              ],
              correctAnswer: ['0-0', '1-1', '2-2'],
              points: 15,
              explanation: `Raíz + terminación según persona`
            };
            break;
            
          case 'true-false':
            const isCorrect = i % 2 === 0;
            question = {
              id: crypto.randomUUID(),
              type: 'true-false',
              question: `¿Es correcta? "${subject.pronoun.charAt(0).toUpperCase() + subject.pronoun.slice(1)} ${isCorrect ? conjugateRegular(verb, subject.conjugationIndex) : conjugateRegular(verb, (subject.conjugationIndex + 2) % 6)}"`,
              options: ['Verdadero', 'Falso'],
              correctAnswer: isCorrect ? 0 : 1,
              points: 10,
              explanation: `Forma correcta: "${conjugateRegular(verb, subject.conjugationIndex)}"`
            };
            break;
            
          case 'open-ended':
            question = {
              id: crypto.randomUUID(),
              type: 'open-ended',
              question: difficultyLevel === 'Fácil'
                ? `Conjuga "${verb}": yo, tú, él/ella.`
                : difficultyLevel === 'Medio'
                ? `Escribe 3 frases con "${verb}" (diferentes sujetos).`
                : `Conjuga "${verb}" completamente (todas las personas) y escribe una frase con cada una.`,
              correctAnswer: 'Respuesta libre',
              points: 20,
              explanation: `${conjugateRegular(verb, 0)}, ${conjugateRegular(verb, 1)}, ${conjugateRegular(verb, 2)}...`
            };
            break;
            
          default:
            question = {
              id: crypto.randomUUID(),
              type: 'multiple-choice',
              question: `"Nosotros _____ (${verb})"`,
              options: [conjugateRegular(verb, 3), conjugateRegular(verb, 0), verb, conjugateRegular(verb, 2)],
              correctAnswer: 0,
              points: 10
            };
        }
        
        questions.push(question);
      }
      return questions;
    }
    
    // Si NO es una consigna específica → preguntas genéricas
    for (let i = 0; i < count; i++) {
      const questionType = types[i % types.length];
      let question: Question = {
        id: crypto.randomUUID(),
        type: questionType,
        question: `Pregunta ${i + 1}: ${text.slice(0, 50)}...`,
        options: questionType === 'multiple-choice' || questionType === 'true-false' 
          ? ['Opción A', 'Opción B', 'Opción C', 'Opción D']
          : undefined,
        correctAnswer: 0,
        points: 10,
        explanation: `Explicación de la pregunta ${i + 1}`
      };
      
      questions.push(question);
    }
    
    return questions;
  };

  const handleGenerate = async () => {
    // Validaciones
    if (!inputText.trim()) {
      toast.error('Por favor, ingresa un texto');
      return;
    }

    if (selectedTypes.length === 0) {
      toast.error('Por favor, selecciona al menos un tipo de pregunta');
      return;
    }

    const sourceText = activeTab === 'text' ? inputText : '';
    
    if (activeTab === 'text' && !sourceText.trim()) {
      toast.error('Por favor, ingresa un texto');
      return;
    }

    if (activeTab === 'pdf' && !pdfFile) {
      toast.error('Por favor, sube un archivo PDF');
      return;
    }

    setIsGenerating(true);

    try {
      let textToProcess = sourceText;

      // Si es PDF, primero extraer el texto
      if (activeTab === 'pdf' && pdfFile) {
        toast.info('Extrayendo texto del PDF...');
        
        // Aquí podrías implementar extracción de PDF
        // Por ahora, pediremos al usuario que pegue el texto
        toast.warning('Por ahora, copia el texto del PDF y pégalo en la pestaña "Texto"');
        setIsGenerating(false);
        setActiveTab('text');
        return;
      }

      // 🔧 ARREGLO: Usar modo demo si projectId no está configurado
      if (projectId === 'DEMO_MODE' || projectId === 'TU_PROJECT_ID_AQUI' || !projectId) {
        console.log('🤖 [IA] Usando generador demo (sin backend)');
        toast.info('🤖 Generando ejercicios prácticos ELE...');
        
        // Simular tiempo de procesamiento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generar ejercicios prácticos
        const generatedQuestions = generateProfessionalELEQuestions(
          textToProcess,
          questionCount,
          selectedLevel,
          difficultyLevel,
          selectedTypes
        );
        
        setQuestions(generatedQuestions);
        toast.success(`¡${generatedQuestions.length} ejercicios generados! (${selectedLevel} - ${difficultyLevel})`);

        if (onQuestionsGenerated) {
          onQuestionsGenerated(generatedQuestions, {
            taskName: 'Ejercicios Generados',
            spanishLevel: selectedLevel,
            difficulty: difficultyLevel,
          });
        }
        
        setIsGenerating(false);
        return;
      }

      // Obtener token de autenticación
      const token = localStorage.getItem('educonnect_auth_token');
      if (!token) {
        toast.error('Debes iniciar sesión');
        setIsGenerating(false);
        return;
      }

      console.log('🤖 [IA] Llamando al endpoint de generación de preguntas...');

      // Llamar al endpoint de generación
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/generate-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': publicAnonKey,
          },
          body: JSON.stringify({
            text: textToProcess,
            taskName: 'Ejercicios Generados',
            spanishLevel: selectedLevel,
            difficulty: difficultyLevel,
            questionCount,
            questionTypes: selectedTypes,
          }),
        }
      );

      if (!response.ok) {
        console.error('❌ [IA] Error en el endpoint:', response.status);
        
        // Si falla el backend, usar modo demo profesional
        toast.warning('Backend no disponible, usando generador ELE demo...');
        
        // Generar ejercicios prácticos
        const generatedQuestions = generateProfessionalELEQuestions(
          textToProcess,
          questionCount,
          selectedLevel,
          difficultyLevel,
          selectedTypes
        );
        
        setQuestions(generatedQuestions);
        toast.success(`¡${generatedQuestions.length} ejercicios generados! (${selectedLevel} - ${difficultyLevel})`);

        if (onQuestionsGenerated) {
          onQuestionsGenerated(generatedQuestions, {
            taskName: 'Ejercicios Generados',
            spanishLevel: selectedLevel,
            difficulty: difficultyLevel,
          });
        }
        
        setIsGenerating(false);
        return;
      }

      const data = await response.json();

      setQuestions(data.questions);
      toast.success(`¡${data.questions.length} preguntas generadas exitosamente!`);

      // Notificar al componente padre
      if (onQuestionsGenerated) {
        onQuestionsGenerated(data.questions, {
          taskName: data.taskName,
          spanishLevel: data.spanishLevel,
          difficulty: data.difficulty,
        });
      }

    } catch (error: any) {
      console.error('❌ [IA] Error generando preguntas:', error);
      
      // Si hay cualquier error, usar modo demo
      toast.warning('Error en el backend, usando generador demo...');
      
      // Generar preguntas de ejemplo
      const generatedQuestions: Question[] = Array.from({ length: Math.min(questionCount, 5) }, (_, i) => ({
        id: crypto.randomUUID(),
        question: `Pregunta ${i + 1} generada automáticamente`,
        type: 'multiple-choice' as const,
        options: [
          'Opción A (correcta)',
          'Opción B',
          'Opción C',
          'Opción D'
        ],
        correctAnswer: 0,
        points: 10
      }));
      
      setQuestions(generatedQuestions);
      toast.success(`¡${generatedQuestions.length} preguntas generadas! (Modo Demo)`);

      if (onQuestionsGenerated) {
        onQuestionsGenerated(generatedQuestions, {
          taskName: 'Ejercicios Generados',
          spanishLevel: selectedLevel,
          difficulty: difficultyLevel,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        toast.error('El archivo no debe superar 10MB');
        return;
      }
      setPdfFile(file);
      toast.success(`Archivo "${file.name}" cargado`);
    }
  };

  const handleUseQuestions = () => {
    if (onQuestionsGenerated && questions.length > 0) {
      onQuestionsGenerated(questions, {
        taskName: 'Ejercicios Generados',
        spanishLevel: selectedLevel,
        difficulty: difficultyLevel,
      });
      onOpenChange(false);
      // Reset
      setQuestions([]);
      setInputText('');
      setPdfFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 100 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Generador de Ejercicios con IA
          </DialogTitle>
          <DialogDescription>
            Crea ejercicios autocorregibles desde un texto o PDF. La IA generará ejercicios prácticos según el nivel y dificultad.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Configuración de la Tarea */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Nombre de la Tarea */}
                  <div className="col-span-2">
                    <Label htmlFor="taskName">Nombre de la Tarea</Label>
                    <Input
                      id="taskName"
                      placeholder="Ej: Ejercicios de QUERER + INFINITIVO"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Nivel de Español */}
                  <div>
                    <Label htmlFor="spanishLevel">Nivel de Español (MCER)</Label>
                    <Select value={spanishLevel} onValueChange={setSpanishLevel}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ zIndex: 150 }}>
                        <SelectItem value="A1">A1 - Principiante</SelectItem>
                        <SelectItem value="A2">A2 - Elemental</SelectItem>
                        <SelectItem value="B1">B1 - Intermedio</SelectItem>
                        <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                        <SelectItem value="C1">C1 - Avanzado</SelectItem>
                        <SelectItem value="C2">C2 - Maestría</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dificultad */}
                  <div>
                    <Label htmlFor="difficulty">Dificultad</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ zIndex: 150 }}>
                        <SelectItem value="Fácil">Fácil</SelectItem>
                        <SelectItem value="Medio">Medio</SelectItem>
                        <SelectItem value="Difícil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cantidad de Preguntas */}
                  <div className="col-span-2">
                    <Label htmlFor="questionCount">Cantidad de Ejercicios</Label>
                    <div className="flex gap-2 mt-1">
                      {[5, 10, 15, 20].map((count) => (
                        <Button
                          key={count}
                          type="button"
                          variant={questionCount === count ? 'default' : 'outline'}
                          onClick={() => setQuestionCount(count)}
                          className="flex-1"
                        >
                          {count}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Preguntas */}
            <Card>
              <CardContent className="pt-6">
                <Label className="text-base">Tipos de Ejercicios</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Selecciona los tipos de ejercicios para nivel {spanishLevel}
                </p>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {questionTypeOptions.map((option) => (
                    <div key={option.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={option.id}
                        checked={selectedQuestionTypes.includes(option.id as QuestionType)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedQuestionTypes([...selectedQuestionTypes, option.id as QuestionType]);
                          } else {
                            setSelectedQuestionTypes(selectedQuestionTypes.filter((type) => type !== option.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <label htmlFor={option.id} className="font-medium cursor-pointer block">
                          {option.label}
                        </label>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedQuestionTypes.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Selecciona al menos un tipo de ejercicio
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Fuente de Contenido */}
            <Card>
              <CardContent className="pt-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'pdf')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Texto
                    </TabsTrigger>
                    <TabsTrigger value="pdf" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      PDF
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="mt-4">
                    <Label htmlFor="inputText">Consigna o Texto Base</Label>
                    <Textarea
                      id="inputText"
                      placeholder='Ejemplos:\n- "Genera ejercicios de la estructura gramatical QUERER + INFINITIVO en español"\n- "Genera ejercicios de presente simple español verbos regulares"\n- O pega un texto para comprensión lectora...'
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={10}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      {inputText.length} caracteres
                    </p>
                  </TabsContent>

                  <TabsContent value="pdf" className="mt-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {pdfFile ? (
                        <div className="space-y-2">
                          <Check className="h-12 w-12 text-green-500 mx-auto" />
                          <p className="font-medium">{pdfFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setPdfFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            Cambiar archivo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <Button onClick={() => fileInputRef.current?.click()}>
                              Seleccionar PDF
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Máximo 10MB
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        <p className="font-medium">Próximamente: Extracción automática de PDF</p>
                        <p className="mt-1">Por ahora, copia el texto del PDF y pégalo en la pestaña "Texto"</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Preguntas Generadas */}
            {questions.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      {questions.length} Ejercicios Generados
                    </h3>
                    <Badge variant="secondary">{spanishLevel}</Badge>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {questions.map((q, idx) => {
                      const isEditing = editingIndex === idx;
                      const currentQ = isEditing ? editedQuestion : q;

                      if (!currentQ) return null;

                      return (
                        <div key={idx} className="p-4 bg-muted/50 rounded-lg border-2 border-transparent hover:border-primary/20 transition-all">
                          {/* Encabezado con botones */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <span className="text-sm text-muted-foreground">Ejercicio {idx + 1}</span>
                            <div className="flex gap-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={saveEditing}
                                    className="h-7 px-2"
                                  >
                                    <Save className="h-3.5 w-3.5 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelEditing}
                                    className="h-7 px-2"
                                  >
                                    <X className="h-3.5 w-3.5 text-red-600" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(idx)}
                                    className="h-7 px-2"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteQuestion(idx)}
                                    className="h-7 px-2"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Pregunta */}
                          {isEditing ? (
                            <Textarea
                              value={currentQ.question}
                              onChange={(e) => updateEditedQuestion('question', e.target.value)}
                              className="mb-2"
                              rows={3}
                            />
                          ) : (
                            <p className="font-medium mb-2" style={{ whiteSpace: 'pre-line' }}>
                              {currentQ.question}
                            </p>
                          )}

                          {/* Opciones de opción múltiple */}
                          {currentQ.options && currentQ.options.length > 0 && (
                            <div className="space-y-2 ml-4 mt-3">
                              {currentQ.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant={currentQ.correctAnswer === optIdx ? 'default' : 'outline'}
                                        onClick={() => setCorrectAnswer(optIdx)}
                                        className="h-6 w-6 p-0 shrink-0"
                                      >
                                        {String.fromCharCode(65 + optIdx)}
                                      </Button>
                                      <Input
                                        value={opt}
                                        onChange={(e) => updateEditedOption(optIdx, e.target.value)}
                                        className="h-8"
                                      />
                                    </>
                                  ) : (
                                    <div
                                      className={`text-sm ${
                                        optIdx === currentQ.correctAnswer
                                          ? 'text-green-600 dark:text-green-400 font-medium'
                                          : ''
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIdx)}. {opt}
                                      {optIdx === currentQ.correctAnswer && ' ✓'}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Pares de emparejamiento */}
                          {currentQ.pairs && (
                            <div className="ml-4 space-y-1 mt-3">
                              {currentQ.pairs.map((pair, pairIdx) => (
                                <div key={pairIdx} className="text-sm">
                                  {pair.left} → {pair.right}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Explicación */}
                          {isEditing ? (
                            <div className="mt-3">
                              <Label className="text-xs">Explicación (opcional)</Label>
                              <Textarea
                                value={currentQ.explanation || ''}
                                onChange={(e) => updateEditedQuestion('explanation', e.target.value)}
                                placeholder="Agrega una explicación..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                          ) : (
                            currentQ.explanation && (
                              <p className="text-sm text-muted-foreground mt-3 ml-4 italic">
                                💡 {currentQ.explanation}
                              </p>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          {questions.length > 0 ? (
            <>
              <Button variant="outline" onClick={() => setQuestions([])}>
                Generar Nuevos
              </Button>
              <Button onClick={handleUseQuestions} className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Usar estos Ejercicios
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !taskName.trim()}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generar con IA
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}