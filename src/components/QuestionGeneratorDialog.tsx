import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check,
  BarChart3,
  AlertCircle,
  Zap
} from 'lucide-react';
import { 
  exportQuestionsToJSON, 
  exportQuestionsToText,
  getQuestionStats,
  Question 
} from '../utils/question-generator';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface QuestionGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestionsGenerated?: (questions: Question[]) => void;
}

export function QuestionGeneratorDialog({ 
  open, 
  onOpenChange,
  onQuestionsGenerated 
}: QuestionGeneratorDialogProps) {
  const [inputText, setInputText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeCompletarBlancos, setIncludeCompletarBlancos] = useState(true);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error('Por favor, ingresa un texto');
      return;
    }

    if (inputText.trim().length < 50) {
      toast.error('El texto debe tener al menos 50 caracteres para generar preguntas de calidad');
      return;
    }

    setIsGenerating(true);
    
    try {
      const token = localStorage.getItem('educonnect_token');
      
      const response = await window.fetch(
        `https://${projectId}.supabase.co/functions/v1/server/make-server-05c2b65f/ai/generate-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || publicAnonKey}`
          },
          body: JSON.stringify({
            text: inputText,
            maxQuestions,
            includeCompletarBlancos
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error response from server:', errorData);
        
        if (response.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (response.status === 429) {
          toast.error('Has alcanzado el límite de solicitudes. Intenta de nuevo en unos momentos.');
        } else {
          toast.error(errorData.error || 'Error al generar preguntas');
        }
        return;
      }

      const data = await response.json();
      
      if (!data.questions || data.questions.length === 0) {
        toast.warning('No se pudieron generar preguntas del texto proporcionado', {
          description: 'Intenta con un texto más detallado o estructurado.'
        });
        return;
      }

      setQuestions(data.questions);
      toast.success(`✨ ${data.questions.length} preguntas generadas con IA de Gemini`, {
        description: 'Preguntas de alta calidad generadas automáticamente'
      });
    } catch (error: any) {
      console.error('Error generando preguntas:', error);
      toast.error('Error al conectar con el servidor', {
        description: 'Verifica tu conexión a internet'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyQuestion = (question: Question, index: number) => {
    const text = `${question.pregunta}\nRespuesta: ${question.respuesta}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Pregunta copiada');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportJSON = () => {
    const json = exportQuestionsToJSON(questions);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuestionario-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Cuestionario exportado en JSON');
  };

  const handleExportText = () => {
    const text = exportQuestionsToText(questions);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuestionario-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Cuestionario exportado en TXT');
  };

  const handleUseQuestions = () => {
    if (onQuestionsGenerated) {
      onQuestionsGenerated(questions);
      toast.success('Preguntas listas para usar');
      onOpenChange(false);
    }
  };

  const stats = questions.length > 0 ? getQuestionStats(questions) : null;

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'definicion': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'propiedad': 'bg-green-500/10 text-green-600 border-green-500/20',
      'ubicacion': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'temporal': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'completar': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
      'identificar': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    };
    return colors[tipo] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'definicion': 'Definición',
      'propiedad': 'Propiedad',
      'ubicacion': 'Ubicación',
      'temporal': 'Temporal',
      'completar': 'Completar',
      'identificar': 'Identificar',
    };
    return labels[tipo] || tipo;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-lime-500" />
            Generador de Preguntas con IA de Gemini
          </DialogTitle>
          <DialogDescription>
            Genera preguntas de alta calidad automáticamente usando inteligencia artificial de Google Gemini.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Área de entrada de texto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="input-text" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Texto fuente
              </Label>
              <div className="text-sm text-muted-foreground">
                {inputText.split(/\s+/).filter(Boolean).length} palabras
              </div>
            </div>
            <Textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pega aquí el texto del que quieres generar preguntas con IA. Mínimo 50 caracteres.&#10;&#10;Ejemplo:&#10;&#10;La fotosíntesis es el proceso mediante el cual las plantas convierten la luz solar en energía química. Este proceso ocurre en los cloroplastos, que contienen clorofila, el pigmento que da a las plantas su color verde. Durante la fotosíntesis, las plantas absorben dióxido de carbono del aire y agua del suelo, y utilizan la energía de la luz solar para convertir estos elementos en glucosa y oxígeno."
              className="min-h-[150px] resize-none font-mono text-sm"
            />
          </div>

          {/* Opciones de generación */}
          <div className="flex items-center gap-6 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch
                id="completar"
                checked={includeCompletarBlancos}
                onCheckedChange={setIncludeCompletarBlancos}
              />
              <Label htmlFor="completar" className="cursor-pointer">
                Incluir completar blancos
              </Label>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Label htmlFor="max-questions">Máximo:</Label>
              <select
                id="max-questions"
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(Number(e.target.value))}
                className="px-2 py-1 rounded border bg-background"
              >
                <option value={10}>10 preguntas</option>
                <option value={20}>20 preguntas</option>
                <option value={30}>30 preguntas</option>
                <option value={50}>50 preguntas</option>
              </select>
            </div>
          </div>

          {/* Botón de generar */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            className="w-full bg-lime-500 hover:bg-lime-600"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generando preguntas...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generar Preguntas
              </>
            )}
          </Button>

          {/* Estadísticas */}
          {stats && (
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-medium text-sm">Estadísticas del cuestionario</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-medium">{stats.total} preguntas</div>
                      </div>
                      {Object.entries(stats.porTipo).map(([tipo, count]) => (
                        <div key={tipo}>
                          <div className="text-muted-foreground">{getTipoLabel(tipo)}</div>
                          <div className="font-medium">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de preguntas generadas */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base">
                  Preguntas generadas ({questions.length})
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportText}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    TXT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    JSON
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] rounded-lg border p-3">
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                #{index + 1}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={getTipoBadgeColor(question.tipo)}
                              >
                                {getTipoLabel(question.tipo)}
                              </Badge>
                            </div>
                            <div className="font-medium">{question.pregunta}</div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Respuesta:</span> {question.respuesta}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyQuestion(question, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Aviso informativo */}
          {questions.length === 0 && !isGenerating && (
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">✨ Potenciado por IA de Google Gemini</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Genera preguntas educativas de alta calidad automáticamente</li>
                      <li>Analiza el contenido y contexto del texto proporcionado</li>
                      <li>Crea preguntas variadas: definiciones, propiedades, ubicaciones, etc.</li>
                      <li>Texto mínimo recomendado: 100-200 palabras para mejores resultados</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {questions.length > 0 && onQuestionsGenerated && (
            <Button
              onClick={handleUseQuestions}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Usar estas preguntas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
