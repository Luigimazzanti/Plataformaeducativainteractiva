import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Upload, Video, FileText, Gamepad2, Sparkles, Check } from 'lucide-react';
import { apiClient } from '../utils/api';
import { FormBuilder } from './FormBuilder';
import { InteractiveFormBuilder, InteractiveActivity } from './InteractiveFormBuilder';
import { QuestionGeneratorDialog } from './QuestionGeneratorDialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useLanguage } from '../utils/LanguageContext';
import { toast } from 'sonner@2.0.3';

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export function CreateAssignmentDialog({ open, onOpenChange, onSubmit }: CreateAssignmentDialogProps) {
  const { t } = useLanguage();
  
  // Estados para creación NORMAL
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<'standard' | 'form' | 'video' | 'interactive'>('standard');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [interactiveActivities, setInteractiveActivities] = useState<InteractiveActivity[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para creación con IA
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);
  const [generatedData, setGeneratedData] = useState<{
    questions: Question[];
    metadata: {
      taskName: string;
      spanishLevel: string;
      difficulty: string;
    };
  } | null>(null);

  // Tab activo: 'normal' o 'ai'
  const [activeCreationMode, setActiveCreationMode] = useState<'normal' | 'ai'>('normal');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(fileList).map(async (file) => {
        console.log('🔍 [CreateAssignment] Subiendo archivo original:', {
          name: file.name,
          type: file.type,
          size: file.size,
        });
        
        const uploadedFile = await apiClient.uploadFile(file);
        
        console.log('📦 [CreateAssignment] Respuesta del backend:', uploadedFile);
        
        // 🔧 ARREGLAR: Asegurar que el archivo tenga nombre, tipo y tamaño correctos
        const processedFile = {
          id: uploadedFile.id || crypto.randomUUID(),
          name: uploadedFile.name || file.name, // Usar nombre original si el backend no lo retorna
          type: uploadedFile.type || file.type, // Usar tipo original
          size: uploadedFile.size ?? file.size, // Usar tamaño original si es undefined
          url: uploadedFile.url,
        };
        
        console.log('✅ [CreateAssignment] Archivo procesado:', processedFile);
        
        return processedFile;
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      console.log('✅ [CreateAssignment] Todos los archivos subidos:', uploadedFiles);
      setFiles([...files, ...uploadedFiles]);
      toast.success(`✅ ${uploadedFiles.length} archivo(s) subido(s)`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(t('uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitNormal = () => {
    if (!title.trim()) {
      toast.error(t('pleaseEnterTitle'));
      return;
    }

    const assignmentData: any = {
      title,
      description,
      dueDate,
      type,
      files,
      createdAt: new Date().toISOString(),
    };

    if (type === 'form') {
      assignmentData.formFields = formFields;
    } else if (type === 'interactive') {
      assignmentData.interactiveActivities = interactiveActivities;
    } else if (type === 'video') {
      assignmentData.videoUrl = videoUrl;
    }

    onSubmit(assignmentData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setDueDate('');
    setType('standard');
    setFormFields([]);
    setInteractiveActivities([]);
    setVideoUrl('');
    setFiles([]);
    onOpenChange(false);
    toast.success('¡Tarea creada exitosamente!');
  };

  const handleQuestionsGenerated = (questions: Question[], metadata: {
    taskName: string;
    spanishLevel: string;
    difficulty: string;
  }) => {
    setGeneratedData({ questions, metadata });
    setShowGeneratorDialog(false);
    toast.success('Preguntas generadas. Ahora puedes crear la tarea.');
  };

  const handleSubmitAI = async () => {
    if (!generatedData) {
      toast.error('Primero genera preguntas con IA');
      return;
    }

    try {
      const assignmentData = {
        title: generatedData.metadata.taskName,
        description: `Nivel: ${generatedData.metadata.spanishLevel} | Dificultad: ${generatedData.metadata.difficulty}`,
        type: 'ai-generated',
        spanishLevel: generatedData.metadata.spanishLevel,
        difficulty: generatedData.metadata.difficulty,
        formFields: generatedData.questions.map((q, idx) => ({
          id: `question-${idx}`,
          type: 'multiple-choice',
          label: q.question,
          required: true,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
        createdAt: new Date().toISOString(),
      };

      await onSubmit(assignmentData);
      
      // Reset
      setGeneratedData(null);
      onOpenChange(false);
      toast.success('¡Tarea creada exitosamente!');
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error('Error al crear la tarea');
    }
  };

  const handleDialogClose = () => {
    setGeneratedData(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setType('standard');
    setFormFields([]);
    setInteractiveActivities([]);
    setVideoUrl('');
    setFiles([]);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('createAssignment')}</DialogTitle>
            <DialogDescription>
              Elige cómo crear tu tarea: manualmente o con IA
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeCreationMode} onValueChange={(v) => setActiveCreationMode(v as 'normal' | 'ai')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="normal" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Crear Normal
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Crear con IA
              </TabsTrigger>
            </TabsList>

            {/* TAB: CREACIÓN NORMAL */}
            <TabsContent value="normal" className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">{t('title')}</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('enterTitle')}
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('enterDescription')}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">{t('dueDate')}</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>{t('assignmentType')}</Label>
                  <Tabs value={type} onValueChange={(v) => setType(v as any)}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="standard">
                        <FileText className="mr-2 h-4 w-4" />
                        {t('standard')}
                      </TabsTrigger>
                      <TabsTrigger value="form">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('form')}
                      </TabsTrigger>
                      <TabsTrigger value="video">
                        <Video className="mr-2 h-4 w-4" />
                        {t('video')}
                      </TabsTrigger>
                      <TabsTrigger value="interactive">
                        <Gamepad2 className="mr-2 h-4 w-4" />
                        {t('interactive')}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="standard" className="space-y-4">
                      <div>
                        <Label className="text-base mb-3 block">{t('uploadFiles')}</Label>
                        
                        {/* Drag & Drop Upload Area */}
                        <div
                          className="relative border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                            const droppedFiles = Array.from(e.dataTransfer.files);
                            if (droppedFiles.length > 0) {
                              const input = document.getElementById('file-upload') as HTMLInputElement;
                              const dataTransfer = new DataTransfer();
                              droppedFiles.forEach(f => dataTransfer.items.add(f));
                              input.files = dataTransfer.files;
                              handleFileUpload({ target: input } as any);
                            }
                          }}
                        >
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                          />
                          
                          <div className="text-center">
                            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                              {isUploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              ) : (
                                <Upload className="w-8 h-8 text-primary" />
                              )}
                            </div>
                            
                            <h4 className="mb-2 font-medium">
                              {isUploading ? t('uploading') : 'Arrastra archivos aquí'}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              o haz click para seleccionar
                            </p>
                            
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              disabled={isUploading}
                              className="gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              {isUploading ? 'Subiendo archivos...' : 'Seleccionar Archivos'}
                            </Button>
                            
                            <p className="text-xs text-muted-foreground mt-3">
                              PDF, Word, Imágenes, Videos, Audio
                            </p>
                          </div>
                        </div>

                        {/* Lista de archivos subidos */}
                        {files.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <Label className="text-sm text-muted-foreground">
                              {files.length} archivo{files.length !== 1 ? 's' : ''} listo{files.length !== 1 ? 's' : ''}
                            </Label>
                            {files.map((file, index) => (
                              <Card key={index} className="overflow-hidden">
                                <CardContent className="flex items-center gap-3 p-3">
                                  {/* Icono según tipo */}
                                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    {file.type?.includes('pdf') ? (
                                      <FileText className="w-5 h-5 text-red-600" />
                                    ) : file.type?.includes('image') ? (
                                      <FileText className="w-5 h-5 text-green-600" />
                                    ) : file.type?.includes('video') ? (
                                      <Video className="w-5 h-5 text-blue-600" />
                                    ) : (
                                      <FileText className="w-5 h-5 text-gray-600" />
                                    )}
                                  </div>
                                  
                                  {/* Info del archivo */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {file.type || 'application/octet-stream'} • {
                                        file.size && !isNaN(file.size) 
                                          ? `${(file.size / 1024).toFixed(1)} KB`
                                          : 'Tamaño desconocido'
                                      }
                                    </p>
                                  </div>
                                  
                                  {/* Check verde */}
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                  
                                  {/* Botón eliminar */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                                    className="flex-shrink-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="form">
                      <FormBuilder fields={formFields} onChange={setFormFields} />
                    </TabsContent>

                    <TabsContent value="video" className="space-y-4">
                      <div>
                        <Label htmlFor="videoUrl">{t('videoUrl')}</Label>
                        <Input
                          id="videoUrl"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="interactive">
                      <InteractiveFormBuilder
                        activities={interactiveActivities}
                        onChange={setInteractiveActivities}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmitNormal}>
                    {t('createAssignment')}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB: CREACIÓN CON IA */}
            <TabsContent value="ai" className="py-6">
              {!generatedData ? (
                // Paso 1: Generar preguntas
                <div className="text-center space-y-6">
                  <div className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-lg border-2 border-dashed">
                    <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Generador de Preguntas con IA
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Crea ejercicios automáticamente desde un texto o PDF
                    </p>
                    <Button 
                      size="lg" 
                      onClick={() => setShowGeneratorDialog(true)}
                      className="gap-2"
                    >
                      <Sparkles className="h-5 w-5" />
                      Abrir Generador de IA
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-1">1</div>
                        <p className="text-muted-foreground">Configura nivel y dificultad</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-1">2</div>
                        <p className="text-muted-foreground">Pega texto o sube PDF</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-1">3</div>
                        <p className="text-muted-foreground">La IA genera preguntas</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                // Paso 2: Revisar y crear
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{generatedData.metadata.taskName}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {generatedData.questions.length} preguntas generadas
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{generatedData.metadata.spanishLevel}</Badge>
                          <Badge variant="outline">{generatedData.metadata.difficulty}</Badge>
                        </div>
                      </div>
                      <Separator className="mb-4" />
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                        {generatedData.questions.map((q, idx) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="font-medium mb-2">
                              {idx + 1}. {q.question}
                            </p>
                            <div className="space-y-1 ml-4 text-xs">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={
                                    optIdx === q.correctAnswer
                                      ? 'text-green-600 dark:text-green-400 font-medium'
                                      : ''
                                  }
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                  {optIdx === q.correctAnswer && ' ✓'}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedData(null);
                        setShowGeneratorDialog(true);
                      }}
                    >
                      Generar Otras
                    </Button>
                    <Button onClick={handleSubmitAI} className="gap-2">
                      <Check className="h-4 w-4" />
                      Crear Tarea
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog del Generador de IA */}
      <QuestionGeneratorDialog
        open={showGeneratorDialog}
        onOpenChange={setShowGeneratorDialog}
        onQuestionsGenerated={handleQuestionsGenerated}
      />
    </>
  );
}