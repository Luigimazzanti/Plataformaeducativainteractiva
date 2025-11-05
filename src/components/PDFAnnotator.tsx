import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  Type, 
  Highlighter, 
  Pencil, 
  Eraser, 
  Download, 
  Send,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Square,
  Circle,
  MessageSquare,
  Save,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import * as pdfjsLib from 'pdfjs-dist';
import { apiClient } from '../utils/api';
import { toast } from 'sonner@2.0.3';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'draw' | 'shape' | 'comment';
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color: string;
  points?: { x: number; y: number }[];
  shape?: 'rectangle' | 'circle';
  fontSize?: number;
}

interface PDFAnnotatorProps {
  pdfUrl: string;
  assignmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  initialAnnotations?: Annotation[];
}

export function PDFAnnotator({ 
  pdfUrl, 
  assignmentId,
  open, 
  onOpenChange, 
  onSubmit,
  readOnly = false,
  initialAnnotations
}: PDFAnnotatorProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'highlight' | 'draw' | 'shape' | 'comment'>('select');
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle'>('rectangle');
  const [currentColor, setCurrentColor] = useState('#fbbf24');
  const [zoom, setZoom] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<{ x: number; y: number }[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<{ x: number; y: number } | null>(null);
  const [fontSize, setFontSize] = useState(16);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF when dialog opens
  useEffect(() => {
    if (open && pdfUrl) {
      loadPDF();
      loadAnnotations();
    }
  }, [open, pdfUrl]);

  // Render page when currentPage changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDoc]);

  // Re-render annotations when they change or page changes
  useEffect(() => {
    renderAnnotations();
  }, [annotations, currentPage, zoom]);

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Error al cargar el PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Set annotation canvas to same size
      if (annotationCanvasRef.current) {
        annotationCanvasRef.current.height = viewport.height;
        annotationCanvasRef.current.width = viewport.width;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      renderAnnotations();
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const loadAnnotations = async () => {
    // If initial annotations provided (e.g., for teacher viewing submission), use those
    if (initialAnnotations && initialAnnotations.length > 0) {
      setAnnotations(initialAnnotations);
      setHistory([initialAnnotations]);
      setHistoryIndex(0);
      return;
    }

    // Otherwise load from server
    try {
      const response = await apiClient.getPDFAnnotations(assignmentId);
      if (response.annotations) {
        setAnnotations(response.annotations);
        setHistory([response.annotations]);
        setHistoryIndex(0);
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
      // Annotations don't exist yet - that's OK
    }
  };

  const saveAnnotations = async () => {
    if (readOnly) return;
    
    try {
      setIsSaving(true);
      await apiClient.savePDFAnnotations(assignmentId, annotations);
      toast.success('Anotaciones guardadas');
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error('Error al guardar anotaciones');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAnnotations = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter annotations for current page
    const pageAnnotations = annotations.filter(ann => ann.page === currentPage);

    pageAnnotations.forEach(ann => {
      ctx.save();

      switch (ann.type) {
        case 'text':
          ctx.fillStyle = ann.color;
          ctx.font = `${ann.fontSize || 16}px Arial`;
          ctx.fillText(ann.content || '', ann.x, ann.y);
          break;

        case 'highlight':
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = ann.color;
          ctx.fillRect(ann.x, ann.y, ann.width || 0, ann.height || 0);
          break;

        case 'draw':
          if (ann.points && ann.points.length > 1) {
            ctx.strokeStyle = ann.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            ann.points.forEach(point => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;

        case 'shape':
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = 2;
          if (ann.shape === 'rectangle') {
            ctx.strokeRect(ann.x, ann.y, ann.width || 0, ann.height || 0);
          } else if (ann.shape === 'circle') {
            const radius = Math.sqrt(Math.pow(ann.width || 0, 2) + Math.pow(ann.height || 0, 2)) / 2;
            ctx.beginPath();
            ctx.arc(ann.x + (ann.width || 0) / 2, ann.y + (ann.height || 0) / 2, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;

        case 'comment':
          // Draw comment icon
          ctx.fillStyle = ann.color;
          ctx.fillRect(ann.x, ann.y, 30, 30);
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px Arial';
          ctx.fillText('💬', ann.x + 5, ann.y + 22);
          break;
      }

      ctx.restore();
    });
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly || selectedTool === 'select') return;

    const { x, y } = getCanvasCoordinates(e);

    if (selectedTool === 'text') {
      setPendingAnnotation({ x, y });
      setShowTextInput(true);
    } else if (selectedTool === 'comment') {
      setPendingAnnotation({ x, y });
      setShowCommentInput(true);
    } else if (selectedTool === 'highlight') {
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: 'highlight',
        page: currentPage,
        x: x - 50,
        y: y - 10,
        width: 100,
        height: 20,
        color: currentColor,
      };
      addAnnotation(newAnnotation);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly || (selectedTool !== 'draw' && selectedTool !== 'shape')) return;

    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentDrawing([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoordinates(e);
    
    if (selectedTool === 'draw') {
      setCurrentDrawing(prev => [...prev, { x, y }]);
      drawTempLine(x, y);
    } else if (selectedTool === 'shape') {
      setCurrentDrawing([currentDrawing[0], { x, y }]);
      drawTempShape(currentDrawing[0].x, currentDrawing[0].y, x, y);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    if (selectedTool === 'draw' && currentDrawing.length > 1) {
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: 'draw',
        page: currentPage,
        x: 0,
        y: 0,
        points: currentDrawing,
        color: currentColor,
      };
      addAnnotation(newAnnotation);
    } else if (selectedTool === 'shape' && currentDrawing.length === 2) {
      const start = currentDrawing[0];
      const end = currentDrawing[1];
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: 'shape',
        page: currentPage,
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
        color: currentColor,
        shape: selectedShape,
      };
      addAnnotation(newAnnotation);
    }
    
    setIsDrawing(false);
    setCurrentDrawing([]);
    renderAnnotations();
  };

  const drawTempLine = (x: number, y: number) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas || currentDrawing.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lastPoint = currentDrawing[currentDrawing.length - 1];
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const drawTempShape = (x1: number, y1: number, x2: number, y2: number) => {
    renderAnnotations(); // Clear previous temp shape
    
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 2;
    
    if (selectedShape === 'rectangle') {
      ctx.strokeRect(
        Math.min(x1, x2),
        Math.min(y1, y2),
        Math.abs(x2 - x1),
        Math.abs(y2 - y1)
      );
    } else if (selectedShape === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const addAnnotation = (annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    renderAnnotations();
    
    // Auto-save after adding annotation
    setTimeout(() => saveAnnotations(), 1000);
  };

  const handleAddText = () => {
    if (!pendingAnnotation || !textInput.trim()) return;

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: 'text',
      page: currentPage,
      x: pendingAnnotation.x,
      y: pendingAnnotation.y,
      content: textInput,
      color: currentColor,
      fontSize: fontSize,
    };
    
    addAnnotation(newAnnotation);
    setTextInput('');
    setShowTextInput(false);
    setPendingAnnotation(null);
  };

  const handleAddComment = () => {
    if (!pendingAnnotation || !commentInput.trim()) return;

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: 'comment',
      page: currentPage,
      x: pendingAnnotation.x,
      y: pendingAnnotation.y,
      content: commentInput,
      color: currentColor,
    };
    
    addAnnotation(newAnnotation);
    setCommentInput('');
    setShowCommentInput(false);
    setPendingAnnotation(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const handleSubmitAssignment = async () => {
    try {
      setIsSubmitting(true);
      
      // First save current annotations
      await saveAnnotations();
      
      // Generate flattened PDF on the server
      await apiClient.submitPDFAssignment(assignmentId);
      
      toast.success('¡Tarea entregada exitosamente!');
      onOpenChange(false);
      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Error al entregar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = [
    { name: 'Amarillo', value: '#fbbf24' },
    { name: 'Verde', value: '#84cc16' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Morado', value: '#a855f7' },
    { name: 'Negro', value: '#000000' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editor de PDF Interactivo</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">Zoom: {zoom}%</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Cargando PDF...</span>
          </div>
        ) : (
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Toolbar */}
            {!readOnly && (
              <div className="w-64 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <h3 className="text-sm">Herramientas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedTool === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTool('text')}
                      className="flex flex-col gap-1 h-auto py-2"
                    >
                      <Type className="w-4 h-4" />
                      <span className="text-xs">Texto</span>
                    </Button>
                    <Button
                      variant={selectedTool === 'highlight' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTool('highlight')}
                      className="flex flex-col gap-1 h-auto py-2"
                    >
                      <Highlighter className="w-4 h-4" />
                      <span className="text-xs">Resaltar</span>
                    </Button>
                    <Button
                      variant={selectedTool === 'draw' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTool('draw')}
                      className="flex flex-col gap-1 h-auto py-2"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="text-xs">Dibujar</span>
                    </Button>
                    <Button
                      variant={selectedTool === 'comment' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTool('comment')}
                      className="flex flex-col gap-1 h-auto py-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs">Comentar</span>
                    </Button>
                    <Button
                      variant={selectedTool === 'shape' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTool('shape')}
                      className="flex flex-col gap-1 h-auto py-2"
                    >
                      <Square className="w-4 h-4" />
                      <span className="text-xs">Formas</span>
                    </Button>
                  </div>
                </div>

                {selectedTool === 'shape' && (
                  <div className="space-y-2">
                    <h3 className="text-sm">Tipo de Forma</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedShape === 'rectangle' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedShape('rectangle')}
                      >
                        <Square className="w-4 h-4 mr-1" />
                        Cuadro
                      </Button>
                      <Button
                        variant={selectedShape === 'circle' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedShape('circle')}
                      >
                        <Circle className="w-4 h-4 mr-1" />
                        Círculo
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTool === 'text' && (
                  <div className="space-y-2">
                    <h3 className="text-sm">Tamaño de Fuente</h3>
                    <Input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      min={8}
                      max={72}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm">Colores</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setCurrentColor(color.value)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${
                          currentColor === color.value
                            ? 'border-gray-900 dark:border-gray-100 ring-2 ring-offset-2'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm">Controles</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleUndo}
                      disabled={historyIndex === 0}
                    >
                      <Undo className="w-4 h-4 mr-2" />
                      Deshacer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleRedo}
                      disabled={historyIndex === history.length - 1}
                    >
                      <Redo className="w-4 h-4 mr-2" />
                      Rehacer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setAnnotations([]);
                        setHistory([[]]);
                        setHistoryIndex(0);
                      }}
                    >
                      <Eraser className="w-4 h-4 mr-2" />
                      Borrar Todo
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm">Zoom</h3>
                  <div className="space-y-2">
                    <Slider
                      value={[zoom]}
                      onValueChange={(v) => setZoom(v[0])}
                      min={50}
                      max={200}
                      step={10}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(Math.min(200, zoom + 10))}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Canvas Container */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 rounded-lg p-4"
            >
              <div 
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s',
                  position: 'relative',
                  display: 'inline-block'
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="bg-white shadow-lg"
                  style={{ display: 'block' }}
                />
                <canvas
                  ref={annotationCanvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="absolute top-0 left-0 cursor-crosshair"
                  style={{ 
                    pointerEvents: readOnly ? 'none' : 'auto',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {annotations.length} anotación{annotations.length !== 1 ? 'es' : ''}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {!readOnly && (
              <>
                <Button 
                  variant="outline" 
                  onClick={saveAnnotations}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar
                </Button>
                {onSubmit && (
                  <Button 
                    onClick={handleSubmitAssignment}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Enviar al Profesor
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Text Input Dialog */}
        {showTextInput && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="mb-4">Agregar Texto</h3>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Escribe el texto aquí..."
                rows={4}
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddText} disabled={!textInput.trim()}>
                  Agregar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowTextInput(false);
                    setTextInput('');
                    setPendingAnnotation(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comment Input Dialog */}
        {showCommentInput && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="mb-4">Agregar Comentario</h3>
              <Textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Escribe tu comentario aquí..."
                rows={4}
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddComment} disabled={!commentInput.trim()}>
                  Agregar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCommentInput(false);
                    setCommentInput('');
                    setPendingAnnotation(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
