import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  Pencil, 
  Trash2,
  Check,
  Download,
  Plus,
  ListChecks
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import jsPDF from 'jspdf';

interface GeneratedQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | string | boolean;
  explanation?: string;
  points: number;
}

interface ImprovedQuestionGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAssignment?: (questions: GeneratedQuestion[], metadata: {
    taskName: string;
    spanishLevel: string;
    difficulty: string;
  }) => void;
}

export function ImprovedQuestionGenerator({ 
  open, 
  onOpenChange,
  onCreateAssignment 
}: ImprovedQuestionGeneratorProps) {
  // Estados
  const [taskName, setTaskName] = useState('');
  const [topic, setTopic] = useState(''); // NUEVO: tema en vez de texto obligatorio
  const [spanishLevel, setSpanishLevel] = useState('B1');
  const [difficulty, setDifficulty] = useState('Medio');
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Tipos de preguntas seleccionados
  const [selectedTypes, setSelectedTypes] = useState({
    'multiple-choice': true,
    'fill-blank': true,
    'true-false': true,
    'short-answer': false,
  });

  const handleGenerate = async () => {
    if (!taskName.trim()) {
      toast.error('Por favor, ingresa un nombre para la tarea');
      return;
    }

    if (!topic.trim()) {
      toast.error('Por favor, ingresa un tema (ej: "Presente Simple")');
      return;
    }

    setIsGenerating(true);

    try {
      const token = localStorage.getItem('educonnect_auth_token');
      if (!token) {
        toast.error('Debes iniciar sesión');
        setIsGenerating(false);
        return;
      }

      // Tipos de preguntas seleccionados
      const questionTypes = Object.keys(selectedTypes).filter(
        (key) => selectedTypes[key as keyof typeof selectedTypes]
      );

      if (questionTypes.length === 0) {
        toast.error('Selecciona al menos un tipo de pregunta');
        setIsGenerating(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/generate-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic, // Enviar tema en lugar de texto
            taskName,
            spanishLevel,
            difficulty,
            questionCount,
            questionTypes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar preguntas');
      }

      const data = await response.json();

      // Agregar IDs únicos
      const questionsWithIds = data.questions.map((q: any, idx: number) => ({
        ...q,
        id: `q-${Date.now()}-${idx}`,
      }));

      setQuestions(questionsWithIds);
      toast.success(`¡${questionsWithIds.length} preguntas generadas!`);

    } catch (error: any) {
      console.error('Error generando preguntas:', error);
      toast.error(error.message || 'Error al generar preguntas');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    toast.success('Pregunta eliminada');
  };

  const handleEditQuestion = (index: number, updatedQuestion: GeneratedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
    setEditingIndex(null);
    toast.success('Pregunta actualizada');
  };

  const handleExportPDF = (includeAnswers: boolean = true) => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(taskName, maxWidth);
    doc.text(titleLines, margin, yPos);
    yPos += (titleLines.length * 7) + 3;

    // Metadata (SOLO si es para profesor)
    if (includeAnswers) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Nivel: ${spanishLevel} | Dificultad: ${difficulty} | CON RESPUESTAS`, margin, yPos);
      yPos += 10;
      doc.setTextColor(0);
    } else {
      // Para estudiantes: solo separador
      yPos += 5;
    }

    // Preguntas
    doc.setFontSize(11);
    questions.forEach((q, idx) => {
      // Check si necesitamos nueva página
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Número y pregunta (con word wrap)
      doc.setFont('helvetica', 'bold');
      const questionLines = doc.splitTextToSize(`${idx + 1}. ${q.question}`, maxWidth);
      doc.text(questionLines, margin, yPos);
      yPos += questionLines.length * 6;
      doc.setFont('helvetica', 'normal');

      // Opciones según tipo
      if (q.type === 'multiple-choice' && q.options) {
        q.options.forEach((opt, optIdx) => {
          const prefix = String.fromCharCode(65 + optIdx);
          const optionText = includeAnswers && optIdx === q.correctAnswer 
            ? `   ${prefix}. ${opt} ✓` 
            : `   ${prefix}. ${opt}`;
          
          const optionLines = doc.splitTextToSize(optionText, maxWidth - 10);
          doc.text(optionLines, margin + 5, yPos);
          yPos += optionLines.length * 5;
        });
      } else if (q.type === 'fill-blank') {
        const blankText = includeAnswers 
          ? `   Respuesta: ${q.correctAnswer}` 
          : `   Respuesta: _________________`;
        doc.text(blankText, margin + 5, yPos);
        yPos += 6;
      } else if (q.type === 'true-false') {
        if (includeAnswers) {
          const correctOption = q.correctAnswer ? 'Verdadero' : 'Falso';
          doc.setFont('helvetica', 'bold');
          doc.text(`   ___  Verdadero  (${q.correctAnswer === true ? 'CORRECTO' : ''})`, margin + 5, yPos);
          yPos += 7;
          doc.text(`   ___  Falso  (${q.correctAnswer === false ? 'CORRECTO' : ''})`, margin + 5, yPos);
          doc.setFont('helvetica', 'normal');
        } else {
          // Líneas para marcar
          doc.setFontSize(12);
          doc.text(`   ___  Verdadero`, margin + 5, yPos);
          yPos += 7;
          doc.text(`   ___  Falso`, margin + 5, yPos);
          doc.setFontSize(11);
        }
        yPos += 6;
      } else if (q.type === 'short-answer') {
        if (includeAnswers) {
          const answerLines = doc.splitTextToSize(`   Respuesta sugerida: ${q.correctAnswer}`, maxWidth - 10);
          doc.text(answerLines, margin + 5, yPos);
          yPos += answerLines.length * 5;
        } else {
          doc.text(`   _________________________________________________`, margin + 5, yPos);
          yPos += 6;
        }
      }

      // Explicación (solo si includeAnswers)
      if (includeAnswers && q.explanation) {
        doc.setFontSize(9);
        doc.setTextColor(80);
        const explLines = doc.splitTextToSize(`   💡 ${q.explanation}`, maxWidth - 10);
        doc.text(explLines, margin + 5, yPos);
        yPos += explLines.length * 4;
        doc.setTextColor(0);
        doc.setFontSize(11);
      }

      yPos += 8; // Espacio entre preguntas
    });

    const filename = includeAnswers 
      ? `${taskName.replace(/\s+/g, '_')}_CON_RESPUESTAS.pdf`
      : `${taskName.replace(/\s+/g, '_')}_ESTUDIANTE.pdf`;
    
    doc.save(filename);
    toast.success(`PDF descargado: ${includeAnswers ? 'Con respuestas' : 'Para estudiantes'}`);
  };

  const handleCreateAssignment = () => {
    if (questions.length === 0) {
      toast.error('No hay preguntas para crear una tarea');
      return;
    }

    if (onCreateAssignment) {
      onCreateAssignment(questions, {
        taskName,
        spanishLevel,
        difficulty,
      });
    }

    // Cerrar y resetear
    onOpenChange(false);
    setQuestions([]);
    setTopic('');
    setTaskName('');
    toast.success('Tarea creada exitosamente');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#84cc16]" />
            Generador Avanzado de Ejercicios con IA
          </DialogTitle>
          <DialogDescription>
            Crea ejercicios personalizados por tema con diferentes tipos de actividades
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Configuración */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Nombre de la Tarea */}
                  <div className="col-span-2">
                    <Label>Nombre de la Tarea</Label>
                    <Input
                      placeholder="Ej: Ejercicios de Presente Simple"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* NUEVO: Tema */}
                  <div className="col-span-2">
                    <Label>Tema o Concepto</Label>
                    <Input
                      placeholder="Ej: Presente Simple, Verbos Irregulares, Adjetivos..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      La IA generará preguntas sobre este tema automáticamente
                    </p>
                  </div>

                  {/* Nivel */}
                  <div>
                    <Label>Nivel (MCER)</Label>
                    <Select value={spanishLevel} onValueChange={setSpanishLevel}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label>Dificultad</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fácil">Fácil</SelectItem>
                        <SelectItem value="Medio">Medio</SelectItem>
                        <SelectItem value="Difícil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-2">
                    <Label>Cantidad de Preguntas</Label>
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

                  {/* Tipos de Preguntas */}
                  <div className="col-span-2">
                    <Label>Tipos de Ejercicios</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="multiple-choice"
                          checked={selectedTypes['multiple-choice']}
                          onCheckedChange={(checked) =>
                            setSelectedTypes({ ...selectedTypes, 'multiple-choice': checked as boolean })
                          }
                        />
                        <label htmlFor="multiple-choice" className="text-sm cursor-pointer">
                          Opción Múltiple
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="fill-blank"
                          checked={selectedTypes['fill-blank']}
                          onCheckedChange={(checked) =>
                            setSelectedTypes({ ...selectedTypes, 'fill-blank': checked as boolean })
                          }
                        />
                        <label htmlFor="fill-blank" className="text-sm cursor-pointer">
                          Rellenar Blancos
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="true-false"
                          checked={selectedTypes['true-false']}
                          onCheckedChange={(checked) =>
                            setSelectedTypes({ ...selectedTypes, 'true-false': checked as boolean })
                          }
                        />
                        <label htmlFor="true-false" className="text-sm cursor-pointer">
                          Verdadero/Falso
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="short-answer"
                          checked={selectedTypes['short-answer']}
                          onCheckedChange={(checked) =>
                            setSelectedTypes({ ...selectedTypes, 'short-answer': checked as boolean })
                          }
                        />
                        <label htmlFor="short-answer" className="text-sm cursor-pointer">
                          Respuesta Corta
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preguntas Generadas */}
            {questions.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-[#84cc16]" />
                      {questions.length} Ejercicios Generados
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleExportPDF(false)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        PDF Estudiante
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExportPDF(true)}
                        className="gap-2 bg-[#84cc16] hover:bg-[#84cc16]/90 text-white border-[#84cc16]"
                      >
                        <Download className="h-4 w-4" />
                        PDF con Respuestas
                      </Button>
                    </div>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        index={idx}
                        isEditing={editingIndex === idx}
                        onEdit={() => setEditingIndex(idx)}
                        onSave={(updated) => handleEditQuestion(idx, updated)}
                        onDelete={() => handleDeleteQuestion(idx)}
                        onCancelEdit={() => setEditingIndex(null)}
                      />
                    ))}
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
                Generar Nuevas
              </Button>
              <Button onClick={handleCreateAssignment} className="bg-[#84cc16] hover:bg-[#84cc16]/90">
                <Check className="h-4 w-4 mr-2" />
                Crear Tarea con estos Ejercicios
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !taskName.trim() || !topic.trim()}
                className="bg-[#84cc16] hover:bg-[#84cc16]/90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
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

// Componente para mostrar/editar cada pregunta
function QuestionCard({ 
  question, 
  index, 
  isEditing, 
  onEdit, 
  onSave, 
  onDelete, 
  onCancelEdit 
}: {
  question: GeneratedQuestion;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (q: GeneratedQuestion) => void;
  onDelete: () => void;
  onCancelEdit: () => void;
}) {
  const [editedQuestion, setEditedQuestion] = useState(question);

  const typeLabels = {
    'multiple-choice': 'Opción Múltiple',
    'fill-blank': 'Rellenar Blancos',
    'true-false': 'Verdadero/Falso',
    'short-answer': 'Respuesta Corta',
  };

  if (isEditing) {
    return (
      <div className="p-4 border-2 border-[#84cc16] rounded-lg bg-[#84cc16]/5">
        <div className="space-y-3">
          <div>
            <Label>Pregunta</Label>
            <Input
              value={editedQuestion.question}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
              className="mt-1"
            />
          </div>
          
          {editedQuestion.type === 'multiple-choice' && editedQuestion.options && (
            <div className="space-y-2">
              <Label>Opciones</Label>
              {editedQuestion.options.map((opt, i) => (
                <Input
                  key={i}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...editedQuestion.options!];
                    newOptions[i] = e.target.value;
                    setEditedQuestion({ ...editedQuestion, options: newOptions });
                  }}
                  placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(editedQuestion)}>
              <Check className="h-4 w-4 mr-1" />
              Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">#{index + 1}</span>
            <Badge variant="outline">{typeLabels[question.type]}</Badge>
            <Badge variant="secondary">{question.points} pt</Badge>
          </div>
          
          <p className="font-medium mb-2">{question.question}</p>
          
          {question.type === 'multiple-choice' && question.options && (
            <div className="space-y-1 ml-4">
              {question.options.map((opt, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    i === question.correctAnswer ? 'text-[#84cc16] font-medium' : ''
                  }`}
                >
                  {String.fromCharCode(65 + i)}. {opt}
                  {i === question.correctAnswer && ' ✓'}
                </div>
              ))}
            </div>
          )}
          
          {question.type === 'fill-blank' && (
            <div className="ml-4 text-sm">
              <span className="text-[#84cc16] font-medium">
                Respuesta: {question.correctAnswer as string}
              </span>
            </div>
          )}
          
          {question.type === 'true-false' && (
            <div className="ml-4 text-sm">
              <span className="text-[#84cc16] font-medium">
                Respuesta: {question.correctAnswer ? 'Verdadero' : 'Falso'}
              </span>
            </div>
          )}
          
          {question.explanation && (
            <p className="text-sm text-muted-foreground mt-2 ml-4 italic">
              💡 {question.explanation}
            </p>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
