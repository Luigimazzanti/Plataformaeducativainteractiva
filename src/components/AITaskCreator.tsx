import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, Image as ImageIcon, Video, Sparkles, Loader2, FileUp, Edit2, Check, Info, WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useLanguage } from '../utils/LanguageContext';
import { apiClient } from '../utils/api';
import { isDemoMode } from '../utils/demo-mode';
import { projectId } from '../utils/supabase/info';

interface AITaskCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

interface GeneratedTask {
  title: string;
  description: string;
  questions: Array<{
    type: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false';
    question: string;
    options?: string[];
    correctAnswer?: string;
    points?: number;
  }>;
  metadata?: {
    spanishLevel?: string;
    difficulty?: string;
    generatedBy?: string;
    generatedAt?: string;
  };
}

export function AITaskCreator({ open, onOpenChange, onTaskCreated }: AITaskCreatorProps) {
  const { t } = useLanguage();
  const [contentType, setContentType] = useState<'text' | 'pdf' | 'image' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [spanishLevel, setSpanishLevel] = useState<string>('standard');
  const [difficulty, setDifficulty] = useState<string>('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTask, setGeneratedTask] = useState<GeneratedTask | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'edit'>('upload');
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [checkingServer, setCheckingServer] = useState(false);

  // Check server availability when dialog opens
  useEffect(() => {
    if (open) {
      checkServerHealth();
    }
  }, [open]);

  const checkServerHealth = async () => {
    setCheckingServer(true);
    try {
      console.log('[AITaskCreator] Verificando disponibilidad del servidor...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-05c2b65f/health`,
        { method: 'GET', signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('[AITaskCreator] ✅ Servidor disponible - IA activa');
        setServerAvailable(true);
      } else {
        console.log('[AITaskCreator] ⚠️ Servidor respondió con error');
        setServerAvailable(false);
      }
    } catch (error: any) {
      console.log('[AITaskCreator] ⚠️ Servidor no disponible:', error.message);
      setServerAvailable(false);
    } finally {
      setCheckingServer(false);
    }
  };

  const handleReset = () => {
    setContentType('text');
    setTextContent('');
    setPdfFile(null);
    setImageFile(null);
    setVideoUrl('');
    setSpanishLevel('standard');
    setDifficulty('normal');
    setGeneratedTask(null);
    setStep('upload');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleGenerateTask = async () => {
    try {
      setIsGenerating(true);

      let content = '';
      let contentData: any = {
        type: contentType,
        spanishLevel: spanishLevel,
        difficulty: difficulty,
      };

      if (contentType === 'text') {
        if (!textContent.trim()) {
          alert('Por favor ingresa el texto del contenido');
          return;
        }
        contentData.content = textContent;
      } else if (contentType === 'pdf') {
        if (!pdfFile) {
          alert('Por favor selecciona un archivo PDF');
          return;
        }
        // Upload PDF
        const uploadedPdf = await apiClient.uploadFile(pdfFile);
        contentData.fileUrl = uploadedPdf.url;
        contentData.fileName = uploadedPdf.name;
      } else if (contentType === 'image') {
        if (!imageFile) {
          alert('Por favor selecciona una imagen');
          return;
        }
        // Upload image
        const uploadedImage = await apiClient.uploadFile(imageFile);
        contentData.fileUrl = uploadedImage.url;
        contentData.fileName = uploadedImage.name;
      } else if (contentType === 'video') {
        if (!videoUrl.trim()) {
          alert('Por favor ingresa la URL del video');
          return;
        }
        contentData.videoUrl = videoUrl;
      }

      // Call AI endpoint to generate task
      const result = await apiClient.generateTaskWithAI(contentData);
      
      if (!result || !result.task) {
        throw new Error('No se recibió respuesta válida de la IA');
      }
      
      setGeneratedTask(result.task);
      setStep('preview');
    } catch (error: any) {
      console.error('[AITaskCreator] Error al generar tarea con IA:', error);
      const errorMessage = error.message || 'Error desconocido';
      
      // Provide more specific error messages
      let userMessage = `Error al generar la tarea: ${errorMessage}`;
      
      if (errorMessage.includes('demo')) {
        userMessage = 'La generación con IA no está disponible en modo demo.\n\nAsegúrate de que:\n- El servidor Edge Function esté desplegado\n- La variable OPENAI_API_KEY esté configurada en Supabase\n- Recarga la página para verificar el estado del servidor';
        setServerAvailable(false);
      } else if (errorMessage.includes('OpenAI')) {
        userMessage = `Error de la API de OpenAI:\n${errorMessage}\n\nVerifica que:\n- Tu API key de OpenAI esté configurada correctamente\n- Tengas créditos disponibles en tu cuenta de OpenAI\n- La API key tenga los permisos necesarios`;
      } else if (errorMessage.includes('401')) {
        userMessage = 'Error de autenticación con OpenAI.\n\nVerifica que tu API key esté configurada correctamente en los secretos de Supabase.';
      } else if (errorMessage.includes('429')) {
        userMessage = 'Límite de tasa excedido.\n\nHas alcanzado el límite de solicitudes de OpenAI. Espera un momento e intenta de nuevo.';
      }
      
      alert(userMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateAndAssign = async () => {
    if (!generatedTask) return;

    try {
      setIsCreating(true);

      // Generate PDF for the task
      const pdfResult = await apiClient.generateTaskPDF(generatedTask);

      // Create assignment with the generated task
      const assignmentData = {
        title: generatedTask.title,
        description: generatedTask.description,
        type: 'standard',
        files: [{
          name: pdfResult.fileName,
          url: pdfResult.url,
          path: pdfResult.path,
          type: 'application/pdf'
        }],
        createdAt: new Date().toISOString(),
        aiGenerated: true,
        questions: generatedTask.questions,
        metadata: generatedTask.metadata // This is only visible to teachers
      };

      await apiClient.createAssignment(assignmentData);
      
      onTaskCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      alert(t('createError') + ': ' + (error.message || 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Server Status Alert */}
      {checkingServer ? (
        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Verificando conexión con el servidor...
          </AlertDescription>
        </Alert>
      ) : serverAvailable === true ? (
        <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Servidor conectado</strong> - La generación con IA está disponible
          </AlertDescription>
        </Alert>
      ) : serverAvailable === false ? (
        <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
          <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>La generación con IA no está disponible</strong>
            <p className="text-sm mt-1">
              El servidor no está disponible o no respondió a tiempo. Verifica:
            </p>
            <ul className="text-sm mt-2 ml-4 list-disc space-y-1">
              <li>Tu conexión a internet</li>
              <li>Que el Edge Function esté desplegado en Supabase</li>
              <li>Que OPENAI_API_KEY esté configurada</li>
            </ul>
            <Button 
              variant="link" 
              size="sm" 
              onClick={checkServerHealth}
              className="mt-2 h-auto p-0 text-red-600 dark:text-red-400"
            >
              Reintentar verificación
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Spanish Level and Difficulty Settings */}
      <Card className="bg-gradient-to-r from-lime-50 to-blue-50 dark:from-lime-950/20 dark:to-blue-950/20 border-lime-200 dark:border-lime-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Configuración de la IA (solo visible para ti)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spanish-level">Nivel de Español</Label>
              <Select value={spanishLevel} onValueChange={setSpanishLevel}>
                <SelectTrigger id="spanish-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1-A2">A1-A2 (Básico)</SelectItem>
                  <SelectItem value="B1-B2">B1-B2 (Intermedio)</SelectItem>
                  <SelectItem value="C1-C2">C1-C2 (Avanzado)</SelectItem>
                  <SelectItem value="standard">Estándar</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nivel del idioma para las preguntas
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Complejidad de las preguntas
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Esta configuración solo es visible para ti como profesor. Los estudiantes solo verán la tarea generada.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="text">
            <FileText className="w-4 h-4 mr-2" />
            Texto
          </TabsTrigger>
          <TabsTrigger value="pdf">
            <FileUp className="w-4 h-4 mr-2" />
            PDF
          </TabsTrigger>
          <TabsTrigger value="image">
            <ImageIcon className="w-4 h-4 mr-2" />
            Imagen
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="w-4 h-4 mr-2" />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="text-content">Contenido de Texto</Label>
            <Textarea
              id="text-content"
              placeholder="Copia y pega el contenido aquí (ej. capítulo de un libro, lección, artículo, etc.)"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={12}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              La IA analizará este texto y generará una tarea educativa estructurada con preguntas y actividades.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-file">Archivo PDF</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
              {pdfFile && (
                <p className="mt-4 text-sm text-primary">
                  <Check className="w-4 h-4 inline mr-2" />
                  {pdfFile.name}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Sube un PDF (ej. capítulo de libro, apuntes, material didáctico) y la IA generará una tarea basada en su contenido.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="image-file">Imagen o Foto</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
              {imageFile && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="max-w-xs mx-auto rounded-lg"
                  />
                  <p className="mt-2 text-sm text-primary">
                    <Check className="w-4 h-4 inline mr-2" />
                    {imageFile.name}
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Sube una imagen (ej. diagrama, infografía, foto de pizarra) y la IA generará preguntas basadas en su contenido visual.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="video" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">URL del Video</Label>
            <Input
              id="video-url"
              type="url"
              placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Proporciona una URL de video (YouTube, Vimeo, etc.) y la IA generará una tarea basada en el contenido del video.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose}>
          {t('cancel')}
        </Button>
        <Button 
          onClick={handleGenerateTask} 
          disabled={isGenerating || serverAvailable === false || checkingServer}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('aiGenerating')}
            </>
          ) : checkingServer ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : serverAvailable === false ? (
            <>
              <WifiOff className="w-4 h-4 mr-2" />
              Servidor No Disponible
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {t('generateTask')}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!generatedTask) return null;

    return (
      <div className="space-y-6">
        {/* Teacher-only metadata */}
        {generatedTask.metadata && (
          <Card className="bg-gradient-to-r from-lime-50 to-blue-50 dark:from-lime-950/20 dark:to-blue-950/20 border-lime-200 dark:border-lime-900">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 text-sm">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Configuración de generación (solo visible para ti):</p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>Nivel de español: <strong>{
                      generatedTask.metadata.spanishLevel === 'A1-A2' ? 'A1-A2 (Básico)' :
                      generatedTask.metadata.spanishLevel === 'B1-B2' ? 'B1-B2 (Intermedio)' :
                      generatedTask.metadata.spanishLevel === 'C1-C2' ? 'C1-C2 (Avanzado)' :
                      'Estándar'
                    }</strong></span>
                    <span>Dificultad: <strong>{
                      generatedTask.metadata.difficulty === 'easy' ? 'Fácil' :
                      generatedTask.metadata.difficulty === 'hard' ? 'Difícil' :
                      'Normal'
                    }</strong></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{generatedTask.title}</CardTitle>
            <CardDescription>{generatedTask.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Preguntas Generadas:</h4>
              <div className="space-y-4">
                {generatedTask.questions.map((q, idx) => (
                  <Card key={idx} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">
                          {idx + 1}. {q.question}
                        </p>
                        {q.points && (
                          <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                            {q.points} pts
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Tipo: {q.type === 'multiple-choice' ? 'Opción Múltiple' : 
                               q.type === 'true-false' ? 'Verdadero/Falso' :
                               q.type === 'short-answer' ? 'Respuesta Corta' : 'Ensayo'}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <ul className="space-y-1 ml-4">
                          {q.options.map((opt, optIdx) => (
                            <li key={optIdx} className={`text-sm ${opt === q.correctAnswer ? 'text-primary font-medium' : ''}`}>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                              {opt === q.correctAnswer && ' ✓'}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.correctAnswer && !q.options && (
                        <p className="text-sm text-primary mt-2">
                          Respuesta: {q.correctAnswer}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <Sparkles className="w-4 h-4 inline mr-2" />
            La IA ha generado esta tarea basándose en el contenido proporcionado. Puedes editarla antes de generar el PDF.
          </p>
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={() => setStep('upload')}>
            Volver
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setStep('edit')}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {t('edit')}
            </Button>
            <Button onClick={handleCreateAndAssign} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {t('generatePDFAndAssign')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditStep = () => {
    if (!generatedTask) return null;

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={generatedTask.title}
              onChange={(e) => setGeneratedTask({ ...generatedTask, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea
              id="edit-description"
              value={generatedTask.description}
              onChange={(e) => setGeneratedTask({ ...generatedTask, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Editar Preguntas:</h4>
          {generatedTask.questions.map((q, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Pregunta {idx + 1}</Label>
                  <Textarea
                    value={q.question}
                    onChange={(e) => {
                      const newQuestions = [...generatedTask.questions];
                      newQuestions[idx] = { ...q, question: e.target.value };
                      setGeneratedTask({ ...generatedTask, questions: newQuestions });
                    }}
                    rows={2}
                  />
                </div>
                {q.options && (
                  <div className="space-y-2">
                    <Label>Opciones</Label>
                    {q.options.map((opt, optIdx) => (
                      <Input
                        key={optIdx}
                        value={opt}
                        onChange={(e) => {
                          const newQuestions = [...generatedTask.questions];
                          const newOptions = [...(q.options || [])];
                          newOptions[optIdx] = e.target.value;
                          newQuestions[idx] = { ...q, options: newOptions };
                          setGeneratedTask({ ...generatedTask, questions: newQuestions });
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newQuestions = generatedTask.questions.filter((_, i) => i !== idx);
                      setGeneratedTask({ ...generatedTask, questions: newQuestions });
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={() => setStep('preview')}>
            Volver
          </Button>
          <Button onClick={handleCreateAndAssign} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {t('generatePDFAndAssign')}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('aiTaskCreation')}
          </DialogTitle>
          <DialogDescription>
            Proporciona contenido (texto, PDF, imagen o video) y la IA generará una tarea educativa estructurada.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'edit' && renderEditStep()}
      </DialogContent>
    </Dialog>
  );
}
