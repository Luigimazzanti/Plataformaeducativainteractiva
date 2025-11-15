import {
  X,
  Save,
  Download,
  Undo,
  Redo,
  Pencil,
  Type,
  Highlighter,
  MessageSquare,
  Check,
  XCircle,
  CheckCircle,
  Eraser,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  Trash2,
  MousePointer,
  Lock,
  Unlock,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { apiClient } from '../utils/api';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configurar worker de PDF.js - ARREGLO: Usar CDN confiable con HTTPS
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Annotation {
  id: string;
  type: 'draw' | 'text' | 'highlight' | 'comment' | 'check' | 'cross' | 'checkmark';
  page: number;
  // 🔧 COORDENADAS NORMALIZADAS (0-1) - Independientes del zoom
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color: string;
  strokeWidth?: number;
  points?: { x: number; y: number }[];
  timestamp: string;
  author: string;
  authorRole: 'student' | 'teacher';
}

interface FullScreenPDFEditorProps {
  assignmentId: string;
  assignmentTitle: string;
  pdfUrl: string;
  userRole: 'student' | 'teacher';
  userId: string;
  userName: string;
  onClose: () => void;
  onSave?: () => void;
  viewingStudentId?: string; // 🆕 ID del estudiante cuya entrega está viendo el profesor
  isGraded?: boolean; // 🆕 Indica si la tarea está calificada (para mostrar correcciones al estudiante)
  submissionId?: string; // 🆕 ID de la submission (para marcarla como graded cuando el profesor finaliza correcciones)
  isLocked?: boolean; // 🆕 Bloquea las herramientas del estudiante (solo lectura)
}

export function FullScreenPDFEditor({
  assignmentId,
  assignmentTitle,
  pdfUrl,
  userRole,
  userId,
  userName,
  onClose,
  onSave,
  viewingStudentId,
  isGraded = false,
  submissionId,
  isLocked = false,
}: FullScreenPDFEditorProps) {
  // 🔥 DEBUG: Verificar props al inicializar
  console.log('🔥🔥🔥 [PDFEditor] PROPS RECIBIDOS:', {
    userRole,
    isGraded,
    isLocked,
    submissionId,
    userId,
    viewingStudentId,
    assignmentId
  });

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]); // Anotaciones del usuario actual
  const [teacherCorrections, setTeacherCorrections] = useState<Annotation[]>([]); // Correcciones del profesor (solo para estudiantes viendo tarea calificada)
  const [activeTool, setActiveTool] = useState<string>('select');
  const [activeColor, setActiveColor] = useState('#FF0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localIsLocked, setLocalIsLocked] = useState(isLocked); // 🔥 Estado local para actualizar el botón inmediatamente
  console.log('🔥🔥🔥 [PDFEditor] ESTADO LOCAL INICIALIZADO - localIsLocked:', localIsLocked, 'prop isLocked:', isLocked);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');
  const [highlightStart, setHighlightStart] = useState<{ x: number; y: number } | null>(null);
  
  // 🔧 ARREGLO: Guardar coordenadas NORMALIZADAS directamente para texto y comentarios
  const [pendingTextPosition, setPendingTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingCommentPosition, setPendingCommentPosition] = useState<{ x: number; y: number } | null>(null);

  // 🆕 Estados para SELECCIONAR y BORRADOR
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredAnnotation, setHoveredAnnotation] = useState<Annotation | null>(null);
  
  // 🆕 Estado para confirmación de borrado
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingPointsRef = useRef<{ x: number; y: number }[]>([]);
  
  // 🆕 Referencia para el tamaño base del viewport (zoom 1.0)
  const baseViewportRef = useRef<{ width: number; height: number } | null>(null);

  // Cargar el PDF
  useEffect(() => {
    loadPDF();
  }, [pdfUrl]);

  // 🔥 Sincronizar estado local cuando el prop isLocked cambie
  useEffect(() => {
    setLocalIsLocked(isLocked);
  }, [isLocked]);

  // Renderizar página cuando cambia
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, zoom]);

  // Renderizar anotaciones cuando cambian
  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderAnnotations();
    }
  }, [annotations, teacherCorrections, currentPage, zoom, selectedAnnotation, hoveredAnnotation]);

  const loadPDF = async () => {
    try {
      console.log('📄 [PDFEditor] Cargando PDF:', pdfUrl);
      setIsLoading(true);
      setLoadError(null);
      
      if (!pdfUrl || pdfUrl.trim() === '') {
        throw new Error('URL del PDF vacía');
      }
      
      if (pdfUrl.includes('placeholder.com')) {
        throw new Error('URL_PLACEHOLDER');
      }
      
      // Cargar anotaciones guardadas
      try {
        // 🔥 ARREGLO CRÍTICO: Si el profesor está viendo la entrega de un estudiante,
        // cargar las anotaciones del ESTUDIANTE, no las del profesor
        const targetUserId = (userRole === 'teacher' && viewingStudentId) ? viewingStudentId : userId;
        
        console.log('📊 [PDFEditor] Cargando anotaciones para:', { userRole, userId, viewingStudentId, targetUserId, isGraded });
        
        const { annotations: savedAnnotations } = await apiClient.getPDFSessionAnnotations(
          assignmentId,
          targetUserId
        );
        
        console.log('📦 [PDFEditor] Anotaciones obtenidas:', { 
          count: savedAnnotations?.length || 0, 
          targetUserId,
          isTeacherViewing: userRole === 'teacher' && viewingStudentId 
        });

        // 🆕 CARGAR CORRECCIONES DEL PROFESOR:
        console.log('🔍 [PDFEditor] Verificando carga de correcciones:', { userRole, viewingStudentId, isGraded, userId });
        
        if (userRole === 'teacher' && viewingStudentId) {
          // 👨‍🏫 PROFESOR viendo entrega → Cargar sus correcciones en ANNOTATIONS (para que pueda editarlas)
          console.log('👨‍🏫 [PDFEditor] Profesor viendo entrega, cargando sus correcciones previas...');
          const { corrections } = await apiClient.getPDFCorrections(assignmentId, viewingStudentId);
          
          const studentAnnots = savedAnnotations || [];
          const teacherCorrects = (corrections && corrections.length > 0) ? corrections : [];
          
          // SIEMPRE combinar, incluso si no hay correcciones previas del profesor
          const combined = [...studentAnnots, ...teacherCorrects];
          setAnnotations(combined);
          setHistory([combined]);
          setHistoryIndex(0);
          console.log('✅ [PDFEditor] Anotaciones combinadas cargadas:', studentAnnots.length, 'estudiante +', teacherCorrects.length, 'profesor');
        } else if (userRole === 'student' && isGraded) {
          // 📚 ESTUDIANTE viendo tarea calificada → Cargar correcciones en capa separada (solo lectura)
          console.log('📚 [PDFEditor] Estudiante viendo tarea calificada, cargando correcciones del profesor...');
          const { corrections } = await apiClient.getPDFCorrections(assignmentId, userId);
          
          console.log('📦 [PDFEditor] Respuesta de getPDFCorrections:', { corrections, length: corrections?.length });
          
          // Cargar las anotaciones del estudiante
          if (savedAnnotations && savedAnnotations.length > 0) {
            setAnnotations(savedAnnotations);
            setHistory([savedAnnotations]);
            setHistoryIndex(0);
            console.log('✅ [PDFEditor] Anotaciones del estudiante cargadas:', savedAnnotations.length);
          }
          
          // Cargar correcciones del profesor en capa separada
          if (corrections && corrections.length > 0) {
            setTeacherCorrections(corrections);
            console.log('✅ [PDFEditor] Correcciones del profesor cargadas:', corrections.length, corrections);
          } else {
            console.log('📝 [PDFEditor] No se encontraron correcciones del profesor');
          }
        } else {
          // Usuario normal (estudiante trabajando o profesor sin viewingStudentId)
          if (savedAnnotations && savedAnnotations.length > 0) {
            setAnnotations(savedAnnotations);
            setHistory([savedAnnotations]);
            setHistoryIndex(0);
            console.log('✅ [PDFEditor] Anotaciones cargadas:', savedAnnotations.length);
          } else {
            console.log('📝 [PDFEditor] No se encontraron anotaciones previas');
          }
        }
      } catch (annotError) {
        console.warn('⚠️ [PDFEditor] No se pudieron cargar anotaciones previas:', annotError);
      }

      console.log('🔄 [PDFEditor] Iniciando carga del PDF...');
      
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        withCredentials: false,
        isEvalSupported: false,
        verbosity: 0,
        useWorkerFetch: false,
        disableAutoFetch: true,
        disableStream: true,
        stopAtErrors: false,
      });
      
      const pdf = await loadingTask.promise;
      
      // 🔧 ARREGLO DEFINITIVO: Guardar baseViewport UNA SOLA VEZ
      const firstPage = await pdf.getPage(1);
      const baseViewport = firstPage.getViewport({ scale: 1.0 });
      baseViewportRef.current = { width: baseViewport.width, height: baseViewport.height };
      console.log('📐 [PDFEditor] Base viewport guardado:', baseViewportRef.current);
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      console.log('✅ [PDFEditor] PDF cargado exitosamente:', pdf.numPages, 'páginas');
      setIsLoading(false);
    } catch (error: any) {
      // 🔧 MEJORADO: Silenciar AbortError completamente
      const errorMessage = error?.message || '';
      const errorName = error?.name || '';
      
      const isAbortError = 
        errorName === 'AbortError' || 
        errorMessage.includes('abort') || 
        errorMessage.includes('signal is aborted') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled');
      
      if (isAbortError) {
        console.warn('⚠️ [PDFEditor] AbortError silenciado (operación cancelada internamente)');
        setIsLoading(false);
        return;
      }
      
      console.error('❌ [PDFEditor] Error cargando PDF:', error);
      
      let displayError = 'Error al cargar el PDF';
      
      if (errorMessage === 'URL_PLACEHOLDER') {
        displayError = '⚠️ El archivo PDF no está disponible. El backend de Supabase no está configurado correctamente.';
      } else if (errorMessage.includes('Invalid PDF')) {
        displayError = 'El archivo no es un PDF válido.';
      } else if (errorMessage.includes('Missing PDF')) {
        displayError = 'No se encontró el archivo PDF.';
      } else if (errorMessage.includes('Network')) {
        displayError = 'Error de red al cargar el PDF. Verifica tu conexión.';
      }
      
      toast.error(displayError);
      setLoadError(displayError);
      setIsLoading(false);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || !baseViewportRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // 🔧 ARREGLO: Usar SIEMPRE el baseViewport guardado, NO recalcularlo
      // Calcular viewport con zoom basado en las dimensiones base
      const viewport = page.getViewport({ scale: zoom });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // 🔧 CRÍTICO: Usar dimensiones exactas basadas en baseViewport
      canvas.width = baseViewportRef.current.width * zoom;
      canvas.height = baseViewportRef.current.height * zoom;

      // Configurar canvas overlay con las MISMAS dimensiones exactas
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = baseViewportRef.current.width * zoom;
        overlayCanvasRef.current.height = baseViewportRef.current.height * zoom;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // 🔧 CRÍTICO: Renderizar anotaciones después de renderizar la página
      // Esto asegura que las anotaciones siempre sean visibles después de zoom
      renderAnnotations();
      
      console.log('✅ [PDFEditor] Página renderizada:', pageNum, 'zoom:', zoom);
    } catch (error) {
      console.error('❌ [PDFEditor] Error renderizando página:', error);
    }
  };

  // 🔄 Convertir coordenadas normalizadas (0-1) a coordenadas del canvas (píxeles)
  const toCanvas = (normalizedX: number, normalizedY: number) => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }
    
    // 🔧 ARREGLO DEFINITIVO: Usar directamente el tamaño actual del canvas
    // El canvas ya tiene el tamaño correcto (baseWidth * zoom)
    return {
      x: normalizedX * canvasRef.current.width,
      y: normalizedY * canvasRef.current.height,
    };
  };

  // 🔄 Convertir coordenadas del canvas (píxeles) a normalizadas (0-1)
  const toNormalized = (canvasX: number, canvasY: number) => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }
    
    // 🔧 ARREGLO DEFINITIVO: Usar directamente el tamaño actual del canvas
    // El canvas ya tiene el tamaño correcto (baseWidth * zoom)
    return {
      x: canvasX / canvasRef.current.width,
      y: canvasY / canvasRef.current.height,
    };
  };

  // 🆕 FUNCIÓN: Word wrap para texto largo (máximo 40 caracteres por línea)
  const wrapText = (text: string, maxCharsPerLine: number = 40): string[] => {
    if (!text || text.length <= maxCharsPerLine) {
      return [text];
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
  };

  // 🆕 FUNCIÓN: Calcular dimensiones de texto con word wrap
  const measureWrappedText = (
    context: CanvasRenderingContext2D,
    text: string,
    font: string = '16px Arial'
  ): { width: number; height: number; lines: string[] } => {
    context.font = font;
    const lines = wrapText(text);
    
    let maxWidth = 0;
    for (const line of lines) {
      const lineWidth = context.measureText(line).width;
      if (lineWidth > maxWidth) {
        maxWidth = lineWidth;
      }
    }

    const lineHeight = 20;
    // 🔧 ARREGLO: Calcular altura visual correcta
    // Primera línea: 16px, líneas adicionales: 20px cada una
    const totalHeight = lines.length === 1 ? 16 : (lines.length - 1) * lineHeight + 16;

    return { width: maxWidth, height: totalHeight, lines };
  };

  const renderAnnotations = () => {
    if (!overlayCanvasRef.current || !canvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Limpiar canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Filtrar anotaciones de la página actual
    const pageAnnotations = annotations.filter(ann => ann.page === currentPage);
    
    // 🆕 Si es estudiante viendo tarea calificada, también filtrar correcciones del profesor
    const pageCorrections = teacherCorrections.filter(ann => ann.page === currentPage);
    console.log('🎨 [Render] Renderizando página', currentPage, ':', pageAnnotations.length, 'anotaciones estudiante +', pageCorrections.length, 'correcciones profesor');
    
    // 🎨 Renderizar PRIMERO las anotaciones del estudiante
    pageAnnotations.forEach(annotation => {
      // 🔧 Convertir coordenadas normalizadas a píxeles del canvas actual
      const pos = toCanvas(annotation.x, annotation.y);
      
      context.strokeStyle = annotation.color;
      context.fillStyle = annotation.color;
      context.lineWidth = annotation.strokeWidth || 2;

      // 🆕 Mostrar selección o hover
      const isSelected = selectedAnnotation?.id === annotation.id;
      const isHovered = hoveredAnnotation?.id === annotation.id && activeTool === 'eraser';

      switch (annotation.type) {
        case 'draw':
          if (annotation.points && annotation.points.length > 1) {
            context.beginPath();
            const firstPoint = toCanvas(annotation.points[0].x, annotation.points[0].y);
            context.moveTo(firstPoint.x, firstPoint.y);
            annotation.points.forEach(point => {
              const canvasPoint = toCanvas(point.x, point.y);
              context.lineTo(canvasPoint.x, canvasPoint.y);
            });
            context.stroke();
            
            // 🆕 Borde de hover para borrador
            if (isHovered) {
              context.strokeStyle = '#EF4444';
              context.lineWidth = (annotation.strokeWidth || 2) + 4;
              context.globalAlpha = 0.5;
              context.stroke();
              context.globalAlpha = 1.0;
            }
          }
          break;

        case 'highlight':
          if (annotation.width && annotation.height) {
            const size = {
              width: annotation.width * canvasRef.current.width,
              height: annotation.height * canvasRef.current.height,
            };
            context.globalAlpha = 0.3;
            context.fillRect(pos.x, pos.y, size.width, size.height);
            context.globalAlpha = 1.0;
            
            if (isHovered) {
              context.strokeStyle = '#EF4444';
              context.lineWidth = 3;
              context.globalAlpha = 0.8;
              context.strokeRect(pos.x, pos.y, size.width, size.height);
              context.globalAlpha = 1.0;
            }
          }
          break;

        case 'text':
          if (annotation.content) {
            // 🔧 ARREGLO REAL: Escalar fuente con zoom
            const fontSize = 16 * zoom;
            const lineHeight = 20 * zoom;
            context.font = `${fontSize}px Arial`;
            context.textBaseline = 'top';
            const { lines, width, height } = measureWrappedText(context, annotation.content, `${fontSize}px Arial`);
            
            // Dibujar cada línea con word wrap
            lines.forEach((line, index) => {
              context.fillStyle = annotation.color;
              context.fillText(line, pos.x, pos.y + (index * lineHeight));
            });
            
            // Selección visual
            if (isSelected) {
              context.strokeStyle = '#3B82F6';
              context.lineWidth = 2;
              context.setLineDash([5, 5]);
              context.strokeRect(pos.x - 2, pos.y - 2, width + 4, height + 4);
              context.setLineDash([]);
            }
            
            if (isHovered) {
              context.fillStyle = 'rgba(239, 68, 68, 0.2)';
              context.fillRect(pos.x - 2, pos.y - 2, width + 4, height + 4);
            }
            
            context.textBaseline = 'alphabetic';
          }
          break;

        case 'comment':
          // 🔧 ARREGLO REAL: Escalar todo con zoom
          const commentRadius = 12 * zoom;
          const commentFontSize = 16 * zoom;
          const commentTextFontSize = 12 * zoom;
          const commentLineHeight = 16 * zoom;
          
          context.fillStyle = annotation.color || '#FFA500';
          context.beginPath();
          context.arc(pos.x, pos.y, commentRadius, 0, 2 * Math.PI);
          context.fill();
          
          context.strokeStyle = '#FFFFFF';
          context.lineWidth = 2 * zoom;
          context.stroke();
          
          context.fillStyle = '#FFFFFF';
          context.font = `bold ${commentFontSize}px Arial`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText('C', pos.x, pos.y);
          
          if (annotation.content) {
            context.font = `${commentTextFontSize}px Arial`;
            const commentLines = wrapText(annotation.content, 35);
            
            // Calcular ancho máximo y altura total
            let maxCommentWidth = 0;
            for (const line of commentLines) {
              const lineWidth = context.measureText(line).width;
              if (lineWidth > maxCommentWidth) {
                maxCommentWidth = lineWidth;
              }
            }
            const totalCommentHeight = commentLines.length * commentLineHeight;
            
            // Fondo del comentario
            context.fillStyle = annotation.color || '#FFA500';
            context.globalAlpha = 0.9;
            context.fillRect(pos.x + 15 * zoom, pos.y - 10 * zoom, maxCommentWidth + 10 * zoom, totalCommentHeight + 4 * zoom);
            context.globalAlpha = 1.0;
            
            // Dibujar cada línea del comentario
            context.fillStyle = '#FFFFFF';
            context.textAlign = 'left';
            context.textBaseline = 'top';
            commentLines.forEach((line, index) => {
              context.fillText(line, pos.x + 20 * zoom, pos.y - 5 * zoom + (index * commentLineHeight));
            });
          }
          
          // Selección visual
          if (isSelected) {
            context.strokeStyle = '#3B82F6';
            context.lineWidth = 3 * zoom;
            context.setLineDash([5 * zoom, 5 * zoom]);
            context.beginPath();
            context.arc(pos.x, pos.y, commentRadius + 4 * zoom, 0, 2 * Math.PI);
            context.stroke();
            context.setLineDash([]);
          }
          
          if (isHovered) {
            context.strokeStyle = '#EF4444';
            context.lineWidth = 3 * zoom;
            context.globalAlpha = 0.8;
            context.beginPath();
            context.arc(pos.x, pos.y, commentRadius + 4 * zoom, 0, 2 * Math.PI);
            context.stroke();
            context.globalAlpha = 1.0;
          }
          break;

        case 'check':
          context.strokeStyle = '#22C55E';
          context.lineWidth = 4 * zoom;
          context.beginPath();
          context.moveTo(pos.x, pos.y);
          context.lineTo(pos.x + 10 * zoom, pos.y + 15 * zoom);
          context.lineTo(pos.x + 25 * zoom, pos.y - 10 * zoom);
          context.stroke();
          
          if (isHovered) {
            context.strokeStyle = '#EF4444';
            context.lineWidth = 6 * zoom;
            context.globalAlpha = 0.5;
            context.beginPath();
            context.moveTo(pos.x, pos.y);
            context.lineTo(pos.x + 10 * zoom, pos.y + 15 * zoom);
            context.lineTo(pos.x + 25 * zoom, pos.y - 10 * zoom);
            context.stroke();
            context.globalAlpha = 1.0;
          }
          break;

        case 'cross':
          context.strokeStyle = '#EF4444';
          context.lineWidth = 4 * zoom;
          context.beginPath();
          context.moveTo(pos.x, pos.y);
          context.lineTo(pos.x + 20 * zoom, pos.y + 20 * zoom);
          context.moveTo(pos.x + 20 * zoom, pos.y);
          context.lineTo(pos.x, pos.y + 20 * zoom);
          context.stroke();
          
          if (isHovered) {
            context.lineWidth = 6 * zoom;
            context.globalAlpha = 0.5;
            context.beginPath();
            context.moveTo(pos.x, pos.y);
            context.lineTo(pos.x + 20 * zoom, pos.y + 20 * zoom);
            context.moveTo(pos.x + 20 * zoom, pos.y);
            context.lineTo(pos.x, pos.y + 20 * zoom);
            context.stroke();
            context.globalAlpha = 1.0;
          }
          break;

        case 'checkmark':
          context.strokeStyle = '#3B82F6';
          context.lineWidth = 6 * zoom;
          context.beginPath();
          context.moveTo(pos.x, pos.y);
          context.lineTo(pos.x + 15 * zoom, pos.y + 20 * zoom);
          context.lineTo(pos.x + 40 * zoom, pos.y - 15 * zoom);
          context.stroke();
          
          if (isHovered) {
            context.strokeStyle = '#EF4444';
            context.lineWidth = 8 * zoom;
            context.globalAlpha = 0.5;
            context.beginPath();
            context.moveTo(pos.x, pos.y);
            context.lineTo(pos.x + 15 * zoom, pos.y + 20 * zoom);
            context.lineTo(pos.x + 40 * zoom, pos.y - 15 * zoom);
            context.stroke();
            context.globalAlpha = 1.0;
          }
          break;
      }
    });

    // 🆕 Renderizar DESPUÉS las correcciones del profesor (encima de las del estudiante)
    pageCorrections.forEach(correction => {
      // 🔧 Convertir coordenadas normalizadas a píxeles del canvas actual
      const pos = toCanvas(correction.x, correction.y);
      
      // 🎨 Usar el color de la corrección
      context.strokeStyle = correction.color;
      context.fillStyle = correction.color;
      context.lineWidth = (correction.strokeWidth || 2) * 1.5; // Más grueso para que destaque
      
      // 🌟 Agregar un ligero resplandor para que se diferencie del estudiante
      context.shadowColor = correction.color;
      context.shadowBlur = 3;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;

      switch (correction.type) {
        case 'draw':
          if (correction.points && correction.points.length > 1) {
            context.beginPath();
            const firstPoint = toCanvas(correction.points[0].x, correction.points[0].y);
            context.moveTo(firstPoint.x, firstPoint.y);
            correction.points.forEach(point => {
              const canvasPoint = toCanvas(point.x, point.y);
              context.lineTo(canvasPoint.x, canvasPoint.y);
            });
            context.stroke();
          }
          break;

        case 'highlight':
          if (correction.width && correction.height) {
            const size = {
              width: correction.width * canvasRef.current.width,
              height: correction.height * canvasRef.current.height,
            };
            context.globalAlpha = 0.3;
            context.fillRect(pos.x, pos.y, size.width, size.height);
            context.globalAlpha = 1.0;
          }
          break;

        case 'text':
          if (correction.content) {
            const fontSize = 16 * zoom;
            const lineHeight = 20 * zoom;
            context.font = `${fontSize}px Arial`;
            context.textBaseline = 'top';
            const { lines, width, height } = measureWrappedText(context, correction.content, `${fontSize}px Arial`);
            
            lines.forEach((line, index) => {
              context.fillStyle = correction.color;
              context.fillText(line, pos.x, pos.y + index * lineHeight);
            });
          }
          break;

        case 'comment':
          const commentRadius = 15 * zoom;
          context.beginPath();
          context.arc(pos.x, pos.y, commentRadius, 0, 2 * Math.PI);
          context.fill();
          
          context.fillStyle = '#FFFFFF';
          context.font = `${12 * zoom}px Arial`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText('💬', pos.x, pos.y);
          break;

        case 'check':
          context.strokeStyle = '#22C55E';
          context.lineWidth = 4 * zoom;
          context.beginPath();
          context.moveTo(pos.x, pos.y);
          context.lineTo(pos.x + 10 * zoom, pos.y + 15 * zoom);
          context.lineTo(pos.x + 25 * zoom, pos.y - 10 * zoom);
          context.stroke();
          break;

        case 'cross':
          context.strokeStyle = '#EF4444';
          context.lineWidth = 4 * zoom;
          context.beginPath();
          context.moveTo(pos.x, pos.y);
          context.lineTo(pos.x + 20 * zoom, pos.y + 20 * zoom);
          context.moveTo(pos.x + 20 * zoom, pos.y);
          context.lineTo(pos.x, pos.y + 20 * zoom);
          context.stroke();
          break;

        case 'checkmark':
          context.strokeStyle = '#3B82F6';
          context.lineWidth = 6 * zoom;
          context.beginPath();
          context.moveTo(pos.x, pos.y);
          context.lineTo(pos.x + 15 * zoom, pos.y + 20 * zoom);
          context.lineTo(pos.x + 40 * zoom, pos.y - 15 * zoom);
          context.stroke();
          break;
      }
      
      // Resetear shadow después de renderizar cada corrección
      context.shadowBlur = 0;
    });
  };

  // 🆕 FUNCIÓN: Encontrar anotación en una posición (usa coordenadas del canvas)
  const findAnnotationAt = (canvasX: number, canvasY: number): Annotation | null => {
    if (!canvasRef.current) return null;
    
    const pageAnnotations = annotations.filter(ann => ann.page === currentPage);
    
    // Buscar de atrás hacia adelante (las más recientes primero)
    for (let i = pageAnnotations.length - 1; i >= 0; i--) {
      const ann = pageAnnotations[i];
      const pos = toCanvas(ann.x, ann.y);
      
      if (ann.type === 'comment') {
        const distance = Math.sqrt((canvasX - pos.x) ** 2 + (canvasY - pos.y) ** 2);
        if (distance <= 15 * zoom) {
          return ann;
        }
      } else if (ann.type === 'text' && ann.content) {
        const context = overlayCanvasRef.current?.getContext('2d');
        if (context) {
          const fontSize = 16 * zoom;
          const { width, height } = measureWrappedText(context, ann.content, `${fontSize}px Arial`);
          
          if (canvasX >= pos.x - 2 && canvasX <= pos.x + width + 2 &&
              canvasY >= pos.y - 2 && canvasY <= pos.y + height + 2) {
            return ann;
          }
        }
      } else if (ann.type === 'highlight' && ann.width && ann.height) {
        const size = {
          width: ann.width * canvasRef.current.width,
          height: ann.height * canvasRef.current.height,
        };
        
        if (canvasX >= pos.x && canvasX <= pos.x + size.width &&
            canvasY >= pos.y && canvasY <= pos.y + size.height) {
          return ann;
        }
      } else if (ann.type === 'draw' && ann.points) {
        for (const point of ann.points) {
          const pointPos = toCanvas(point.x, point.y);
          const distance = Math.sqrt((canvasX - pointPos.x) ** 2 + (canvasY - pointPos.y) ** 2);
          if (distance <= 10 * zoom) {
            return ann;
          }
        }
      } else if ((ann.type === 'check' || ann.type === 'cross' || ann.type === 'checkmark')) {
        if (canvasX >= pos.x - 5 * zoom && canvasX <= pos.x + 35 * zoom &&
            canvasY >= pos.y - 15 * zoom && canvasY <= pos.y + 25 * zoom) {
          return ann;
        }
      }
    }
    
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 🔒 Si el estudiante tiene el PDF bloqueado, no permitir interacciones
    if (userRole === 'student' && isLocked) return;
    
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // 🆕 HERRAMIENTA BORRADOR: Borrar al hacer click
    if (activeTool === 'eraser') {
      const clicked = findAnnotationAt(canvasX, canvasY);
      if (clicked) {
        const updatedAnnotations = annotations.filter(ann => ann.id !== clicked.id);
        setAnnotations(updatedAnnotations);
        setHasUnsavedChanges(true);
        setHoveredAnnotation(null);
        
        // Agregar al historial
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updatedAnnotations);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        toast.success('🗑️ Anotación eliminada');
        console.log('🗑️ [Eraser] Anotación eliminada:', clicked.type);
      }
      return;
    }

    // 🆕 HERRAMIENTA SELECCIONAR: Detectar click en anotación
    if (activeTool === 'select') {
      const clicked = findAnnotationAt(canvasX, canvasY);
      if (clicked && (clicked.type === 'text' || clicked.type === 'comment')) {
        setSelectedAnnotation(clicked);
        setIsDragging(true);
        const pos = toCanvas(clicked.x, clicked.y);
        setDragOffset({ x: canvasX - pos.x, y: canvasY - pos.y });
        console.log('🔵 [Select] Anotación seleccionada:', clicked.type);
      } else {
        setSelectedAnnotation(null);
      }
      return;
    }

    if (activeTool === 'draw') {
      setIsDrawing(true);
      drawingPointsRef.current = [{ x: canvasX, y: canvasY }];
    } else if (activeTool === 'comment') {
      setShowCommentInput(true);
      setCommentPosition({ x: e.clientX, y: e.clientY });
      setPendingCommentPosition(toNormalized(canvasX, canvasY));
    } else if (activeTool === 'check' || activeTool === 'cross' || activeTool === 'checkmark') {
      const normalized = toNormalized(canvasX, canvasY);
      addAnnotation({
        type: activeTool,
        x: normalized.x,
        y: normalized.y,
      });
    } else if (activeTool === 'text') {
      setShowTextInput(true);
      setTextInputPosition({ x: e.clientX, y: e.clientY });
      setPendingTextPosition(toNormalized(canvasX, canvasY));
    } else if (activeTool === 'highlight') {
      setIsDrawing(true);
      setHighlightStart({ x: canvasX, y: canvasY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // 🆕 BORRADOR: Mostrar hover
    if (activeTool === 'eraser') {
      const hovered = findAnnotationAt(canvasX, canvasY);
      setHoveredAnnotation(hovered);
      return;
    }

    // 🆕 ARRASTRAR ANOTACIÓN (Modo SELECT)
    if (isDragging && selectedAnnotation && activeTool === 'select') {
      const newCanvasX = canvasX - dragOffset.x;
      const newCanvasY = canvasY - dragOffset.y;
      const normalized = toNormalized(newCanvasX, newCanvasY);
      
      const updatedAnnotations = annotations.map(ann => 
        ann.id === selectedAnnotation.id
          ? { ...ann, x: normalized.x, y: normalized.y }
          : ann
      );
      
      setAnnotations(updatedAnnotations);
      setSelectedAnnotation({ ...selectedAnnotation, x: normalized.x, y: normalized.y });
      return;
    }

    // DIBUJAR (Modo DRAW)
    if (!isDrawing || activeTool !== 'draw') return;

    drawingPointsRef.current.push({ x: canvasX, y: canvasY });

    const canvas = overlayCanvasRef.current;
    const context = canvas?.getContext('2d');
    
    if (!context) return;

    context.strokeStyle = activeColor;
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (drawingPointsRef.current.length > 1) {
      const points = drawingPointsRef.current;
      const lastPoint = points[points.length - 2];
      const currentPoint = points[points.length - 1];

      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(currentPoint.x, currentPoint.y);
      context.stroke();
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // FINALIZAR ARRASTRE (Modo SELECT)
    if (isDragging && activeTool === 'select') {
      setIsDragging(false);
      setHasUnsavedChanges(true);
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...annotations]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      console.log('✅ [Select] Anotación movida exitosamente');
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'draw' && drawingPointsRef.current.length > 0) {
      // 🔧 Normalizar todos los puntos
      const normalizedPoints = drawingPointsRef.current.map(p => toNormalized(p.x, p.y));
      
      addAnnotation({
        type: 'draw',
        points: normalizedPoints,
      });
      drawingPointsRef.current = [];
    } else if (activeTool === 'highlight' && highlightStart) {
      const rect = overlayCanvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const width = Math.abs(canvasX - highlightStart.x);
      const height = Math.abs(canvasY - highlightStart.y);
      const startX = Math.min(canvasX, highlightStart.x);
      const startY = Math.min(canvasY, highlightStart.y);

      if (width > 5 && height > 5) {
        const normalizedStart = toNormalized(startX, startY);
        const normalizedSize = {
          width: width / (canvasRef.current?.width || 1),
          height: height / (canvasRef.current?.height || 1),
        };
        
        addAnnotation({
          type: 'highlight',
          x: normalizedStart.x,
          y: normalizedStart.y,
          width: normalizedSize.width,
          height: normalizedSize.height,
        });
      }

      setHighlightStart(null);
    }

    setIsDrawing(false);
  };

  const addAnnotation = (annotationData: Partial<Annotation>) => {
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      page: currentPage,
      x: annotationData.x || 0,
      y: annotationData.y || 0,
      type: annotationData.type || 'draw',
      color: activeColor,
      strokeWidth: 2,
      points: annotationData.points,
      content: annotationData.content,
      width: annotationData.width,
      height: annotationData.height,
      timestamp: new Date().toISOString(),
      author: userName,
      authorRole: userRole,
    };

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    setHasUnsavedChanges(true);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    console.log('✅ [PDFEditor] Anotación agregada:', newAnnotation.type);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !pendingCommentPosition) return;

    addAnnotation({
      type: 'comment',
      x: pendingCommentPosition.x,
      y: pendingCommentPosition.y,
      content: commentText,
    });

    setCommentText('');
    setShowCommentInput(false);
    setPendingCommentPosition(null);
  };

  const handleAddText = () => {
    if (!textInputValue.trim() || !pendingTextPosition) return;

    addAnnotation({
      type: 'text',
      x: pendingTextPosition.x,
      y: pendingTextPosition.y,
      content: textInputValue,
    });

    setTextInputValue('');
    setShowTextInput(false);
    setPendingTextPosition(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
      setHasUnsavedChanges(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('💾 [PDFEditor] Guardando anotaciones...', annotations.length);
      
      // 🔥 ARREGLO: Si el profesor está corrigiendo, guardar en clave de CORRECCIONES
      if (userRole === 'teacher' && viewingStudentId) {
        console.log('👨‍🏫 [PDFEditor] Profesor guardando correcciones para estudiante:', viewingStudentId);
        // Filtrar SOLO las anotaciones del profesor (authorRole === 'teacher')
        const teacherAnnotations = annotations.filter(ann => ann.authorRole === 'teacher');
        console.log('📝 [PDFEditor] Filtrando anotaciones:', annotations.length, 'total →', teacherAnnotations.length, 'del profesor');
        // Guardar en clave especial: pdf_corrections_{assignmentId}_{studentId}
        await apiClient.updatePDFCorrections(assignmentId, viewingStudentId, teacherAnnotations);
        toast.success('✅ Correcciones guardadas - El estudiante las verá en su entrega');
      } else {
        // Guardar normalmente (estudiante trabajando en su tarea)
        console.log('📝 [PDFEditor] Guardando anotaciones normales');
        await apiClient.updatePDFSessionAnnotations(assignmentId, userId, annotations);
        toast.success('✅ Cambios guardados exitosamente');
      }
      
      setHasUnsavedChanges(false);
      console.log('✅ [PDFEditor] Anotaciones guardadas:', annotations.length);
    } catch (error) {
      console.error('❌ [PDFEditor] Error guardando:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      toast.info('🔄 Generando PDF con anotaciones...');
      console.log('📥 [Download] Iniciando descarga con anotaciones');
      
      const response = await fetch(pdfUrl);
      const pdfArrayBuffer = await response.arrayBuffer();
      
      const pdfLibDoc = await PDFDocument.load(pdfArrayBuffer);
      const pages = pdfLibDoc.getPages();
      
      console.log('📄 [Download] PDF cargado:', pages.length, 'páginas');
      
      // 🔧 Escala para descarga (alta calidad)
      const downloadScale = 2.0;
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageAnnotations = annotations.filter(ann => ann.page === pageNum);
        
        if (pageAnnotations.length === 0) {
          console.log(`⏭️ [Download] Página ${pageNum}: Sin anotaciones, saltando`);
          continue;
        }
        
        console.log(`🎨 [Download] Renderizando página ${pageNum} con ${pageAnnotations.length} anotaciones`);
        
        const tempCanvas = document.createElement('canvas');
        const tempOverlayCanvas = document.createElement('canvas');
        
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: downloadScale });
        
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        tempOverlayCanvas.width = viewport.width;
        tempOverlayCanvas.height = viewport.height;
        
        const context = tempCanvas.getContext('2d')!;
        const overlayContext = tempOverlayCanvas.getContext('2d')!;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // 🔧 Renderizar anotaciones con coordenadas normalizadas
        pageAnnotations.forEach(annotation => {
          // Convertir coordenadas normalizadas a píxeles del canvas de descarga
          const x = annotation.x * viewport.width;
          const y = annotation.y * viewport.height;
          
          overlayContext.strokeStyle = annotation.color;
          overlayContext.fillStyle = annotation.color;
          overlayContext.lineWidth = (annotation.strokeWidth || 2) * downloadScale;

          switch (annotation.type) {
            case 'draw':
              if (annotation.points && annotation.points.length > 1) {
                overlayContext.beginPath();
                const firstPoint = {
                  x: annotation.points[0].x * viewport.width,
                  y: annotation.points[0].y * viewport.height,
                };
                overlayContext.moveTo(firstPoint.x, firstPoint.y);
                annotation.points.forEach(point => {
                  const px = point.x * viewport.width;
                  const py = point.y * viewport.height;
                  overlayContext.lineTo(px, py);
                });
                overlayContext.stroke();
              }
              break;

            case 'highlight':
              if (annotation.width && annotation.height) {
                const w = annotation.width * viewport.width;
                const h = annotation.height * viewport.height;
                overlayContext.globalAlpha = 0.3;
                overlayContext.fillRect(x, y, w, h);
                overlayContext.globalAlpha = 1.0;
              }
              break;

            case 'text':
              overlayContext.font = `${16 * downloadScale}px Arial`;
              overlayContext.textBaseline = 'top';
              overlayContext.fillStyle = annotation.color;
              
              // 🔧 ARREGLO: Aplicar word wrap también en descarga
              const textLines = wrapText(annotation.content, 40);
              const textLineHeight = 20 * downloadScale;
              
              textLines.forEach((line, index) => {
                overlayContext.fillText(line, x, y + (index * textLineHeight));
              });
              
              overlayContext.textBaseline = 'alphabetic';
              break;

            case 'comment':
              overlayContext.fillStyle = annotation.color || '#FFA500';
              overlayContext.beginPath();
              overlayContext.arc(x, y, 12 * downloadScale, 0, 2 * Math.PI);
              overlayContext.fill();
              
              overlayContext.strokeStyle = '#FFFFFF';
              overlayContext.lineWidth = 2 * downloadScale;
              overlayContext.stroke();
              
              overlayContext.fillStyle = '#FFFFFF';
              overlayContext.font = `bold ${16 * downloadScale}px Arial`;
              overlayContext.textAlign = 'center';
              overlayContext.textBaseline = 'middle';
              overlayContext.fillText('C', x, y);
              
              if (annotation.content) {
                // 🔧 Aplicar word wrap al comentario
                overlayContext.font = `${12 * downloadScale}px Arial`;
                const commentLines = wrapText(annotation.content, 35); // Máximo 35 caracteres por línea para comentarios
                const commentLineHeight = 16 * downloadScale;
                
                // Calcular ancho máximo y altura total
                let maxCommentWidth = 0;
                for (const line of commentLines) {
                  const lineWidth = overlayContext.measureText(line).width;
                  if (lineWidth > maxCommentWidth) {
                    maxCommentWidth = lineWidth;
                  }
                }
                const totalCommentHeight = commentLines.length * commentLineHeight;
                
                // Fondo del comentario
                overlayContext.fillStyle = annotation.color || '#FFA500';
                overlayContext.globalAlpha = 0.9;
                overlayContext.fillRect(x + 15 * downloadScale, y - 10 * downloadScale, maxCommentWidth + 10 * downloadScale, totalCommentHeight + 4);
                overlayContext.globalAlpha = 1.0;
                
                // Dibujar cada línea del comentario
                overlayContext.fillStyle = '#FFFFFF';
                overlayContext.textAlign = 'left';
                overlayContext.textBaseline = 'top';
                commentLines.forEach((line, index) => {
                  overlayContext.fillText(line, x + 20 * downloadScale, y - 5 * downloadScale + (index * commentLineHeight));
                });
              }
              break;

            case 'check':
              overlayContext.strokeStyle = '#22C55E';
              overlayContext.lineWidth = 4 * downloadScale;
              overlayContext.beginPath();
              overlayContext.moveTo(x, y);
              overlayContext.lineTo(x + 10 * downloadScale, y + 15 * downloadScale);
              overlayContext.lineTo(x + 25 * downloadScale, y - 10 * downloadScale);
              overlayContext.stroke();
              break;

            case 'cross':
              overlayContext.strokeStyle = '#EF4444';
              overlayContext.lineWidth = 4 * downloadScale;
              overlayContext.beginPath();
              overlayContext.moveTo(x, y);
              overlayContext.lineTo(x + 20 * downloadScale, y + 20 * downloadScale);
              overlayContext.moveTo(x + 20 * downloadScale, y);
              overlayContext.lineTo(x, y + 20 * downloadScale);
              overlayContext.stroke();
              break;

            case 'checkmark':
              overlayContext.strokeStyle = '#3B82F6';
              overlayContext.lineWidth = 6 * downloadScale;
              overlayContext.beginPath();
              overlayContext.moveTo(x, y);
              overlayContext.lineTo(x + 15 * downloadScale, y + 20 * downloadScale);
              overlayContext.lineTo(x + 40 * downloadScale, y - 15 * downloadScale);
              overlayContext.stroke();
              break;
          }
        });
        
        context.drawImage(tempOverlayCanvas, 0, 0);
        
        const imageDataUrl = tempCanvas.toDataURL('image/png');
        const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
        
        const pngImage = await pdfLibDoc.embedPng(imageBytes);
        const pdfPage = pages[pageNum - 1];
        const { width, height } = pdfPage.getSize();
        
        pdfPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
        
        console.log(`✅ [Download] Página ${pageNum} procesada`);
      }
      
      const pdfBytes = await pdfLibDoc.save();
      console.log('💾 [Download] PDF generado:', pdfBytes.length, 'bytes');
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignmentTitle}_con_anotaciones.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('✅ PDF descargado con todas las anotaciones');
      console.log('✅ [Download] Descarga completada');
    } catch (error) {
      console.error('❌ [Download] Error:', error);
      toast.error('Error al generar el PDF con anotaciones');
    }
  };

  const handleSubmit = async () => {
    try {
      await handleSave();
      await apiClient.submitPDFTask(assignmentId, userId, pdfUrl);
      toast.success('✅ Tarea enviada al profesor');
      onClose();
    } catch (error: any) {
      console.error('❌ [PDFEditor] Error enviando:', error);
      
      // Mostrar mensaje específico si es error de cuota
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
        toast.error('⚠️ Espacio de almacenamiento lleno. Se limpiaron datos antiguos. Intenta de nuevo.', {
          duration: 5000
        });
      } else {
        toast.error('Error al enviar la tarea');
      }
    }
  };

  // 🆕 FUNCIÓN PARA QUE EL PROFESOR FINALICE Y ENVÍE LAS CORRECCIONES
  const handleSubmitCorrections = async () => {
    console.log('🔥 [PDFEditor] ===== INICIANDO handleSubmitCorrections =====');
    console.log('🔥 [PDFEditor] Datos:', {
      submissionId,
      assignmentId,
      viewingStudentId,
      hasAnnotations: annotations.length > 0
    });
    
    try {
      // 1. Guardar las correcciones
      console.log('📝 [PDFEditor] Guardando correcciones...');
      await handleSave();
      console.log('✅ [PDFEditor] Correcciones guardadas');
      
      // 2. Actualizar el status de la submission a 'GRADED' y BLOQUEAR para que el estudiante no pueda editar
      if (submissionId) {
        console.log('🔒 [PDFEditor] Bloqueando submission:', submissionId);
        await apiClient.updateSubmission(submissionId, { 
          status: 'GRADED', // 🔥 ARREGLADO: Usar MAYÚSCULAS para coincidir con el tipo
          isLocked: true // 🔒 BLOQUEAR para evitar que el estudiante edite después de la corrección
        });
        console.log('✅ [PDFEditor] Submission bloqueada exitosamente');
        
        // 🔥 ACTUALIZAR EL ESTADO LOCAL INMEDIATAMENTE
        setLocalIsLocked(true);
      } else {
        console.warn('⚠️ [PDFEditor] No hay submissionId para bloquear');
      }
      
      // 3. Las correcciones ya están guardadas y disponibles para el estudiante
      toast.success('✅ Correcciones finalizadas y bloqueadas para el estudiante');
      console.log('🎉 [PDFEditor] ¡Proceso completado exitosamente!');
    } catch (error) {
      console.error('❌ [PDFEditor] Error finalizando correcciones:', error);
      toast.error('Error al finalizar las correcciones');
    }
  };

  // 🆕 FUNCIÓN PARA QUE EL PROFESOR DESBLOQUEE EL PDF
  const handleUnlockPDF = async () => {
    console.log('🔥 [PDFEditor] ===== INICIANDO handleUnlockPDF =====');
    console.log('🔥 [PDFEditor] submissionId:', submissionId);
    
    try {
      if (submissionId) {
        console.log('🔓 [PDFEditor] Desbloqueando PDF:', submissionId);
        await apiClient.updateSubmission(submissionId, { 
          isLocked: false // 🔓 DESBLOQUEAR para que el estudiante pueda volver a editar
        });
        console.log('✅ [PDFEditor] PDF desbloqueado exitosamente');
        
        // 🔥 ACTUALIZAR EL ESTADO LOCAL INMEDIATAMENTE
        setLocalIsLocked(false);
        
        toast.success('🔓 PDF desbloqueado - El estudiante puede editar');
      } else {
        console.error('❌ [PDFEditor] No hay submissionId para desbloquear');
        toast.error('Error: No se puede desbloquear (submissionId faltante)');
      }
    } catch (error) {
      console.error('❌ [PDFEditor] Error desbloqueando:', error);
      toast.error('Error al desbloquear el PDF');
    }
  };

  const handleClearAnnotations = () => {
    setShowClearConfirm(true);
  };
  
  const confirmClearAnnotations = () => {
    setAnnotations([]);
    setHasUnsavedChanges(true);
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    setShowClearConfirm(false);
    toast.success('Anotaciones eliminadas');
  };

  // Herramientas
  const studentTools = [
    { id: 'select', icon: <MousePointer className="w-4 h-4" />, label: 'Seleccionar' },
    { id: 'draw', icon: <Pencil className="w-4 h-4" />, label: 'Dibujar' },
    { id: 'text', icon: <Type className="w-4 h-4" />, label: 'Texto' },
    { id: 'highlight', icon: <Highlighter className="w-4 h-4" />, label: 'Resaltar' },
    { id: 'comment', icon: <MessageSquare className="w-4 h-4" />, label: 'Comentario' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Borrador' },
  ];

  const teacherTools = [
    ...studentTools,
    { id: 'check', icon: <Check className="w-4 h-4" />, label: 'Correcto' },
    { id: 'cross', icon: <XCircle className="w-4 h-4" />, label: 'Error' },
    { id: 'checkmark', icon: <CheckCircle className="w-4 h-4" />, label: 'Aprobado' },
  ];

  // 🔒 Si el estudiante tiene el PDF bloqueado, deshabilitar herramientas de edición
  const tools = userRole === 'teacher' 
    ? teacherTools 
    : (localIsLocked ? [] : studentTools);
  
  console.log('🔥🔥🔥 [PDFEditor] HERRAMIENTAS CALCULADAS:', {
    userRole,
    localIsLocked,
    isLocked,
    isGraded,
    toolsCount: tools.length,
    tools: tools.map(t => t.id)
  });

  const colors = [
    { value: '#EF4444', label: 'Rojo' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#22C55E', label: 'Verde' },
    { value: '#FFA500', label: 'Naranja' },
    { value: '#8B5CF6', label: 'Morado' },
    { value: '#000000', label: 'Negro' },
  ];

  // 🆕 Cursor personalizado según herramienta
  const getCursorClass = () => {
    if (activeTool === 'select') return 'cursor-default';
    if (activeTool === 'eraser') return 'cursor-pointer';
    return 'cursor-crosshair';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header con Toolbar */}
      <div className="border-b bg-card shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold truncate max-w-[300px]">
              {assignmentTitle}
            </h2>
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="animate-pulse">
                Cambios sin guardar
              </Badge>
            )}
            <Badge variant="outline">
              {userRole === 'teacher' ? 'Modo Profesor' : 'Modo Estudiante'}
            </Badge>
            {userRole === 'student' && teacherCorrections.length > 0 && (
              <Badge className="bg-[#3b82f6] text-white">
                ✏️ {teacherCorrections.length} corrección{teacherCorrections.length !== 1 ? 'es' : ''} del profesor
              </Badge>
            )}
            {userRole === 'student' && localIsLocked && (
              <Badge className="bg-red-500 text-white">
                🔒 Bloqueado - Solo lectura
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges || (userRole === 'student' && isLocked)}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            {userRole === 'student' && !localIsLocked && !isGraded && (
              <Button size="sm" onClick={handleSubmit}>
                <Upload className="w-4 h-4 mr-2" />
                Enviar al Profesor
              </Button>
            )}
            {userRole === 'teacher' && viewingStudentId && (
              <>
                {!localIsLocked ? (
                  <Button 
                    size="sm" 
                    onClick={handleSubmitCorrections}
                    className="bg-gradient-to-r from-[#3b82f6] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    ✅ Finalizar y Bloquear
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={handleUnlockPDF}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    🔓 Desbloquear PDF
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Toolbar de herramientas */}
        <div className="border-t p-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 border-r pr-4">
            {tools.map(tool => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTool(tool.id);
                  setSelectedAnnotation(null);
                  setHoveredAnnotation(null);
                }}
                title={tool.label}
              >
                {tool.icon}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-r pr-4">
            {colors.map(color => (
              <button
                key={color.value}
                className={`w-8 h-8 rounded-full border-2 ${
                  activeColor === color.value ? 'border-primary ring-2 ring-primary' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => setActiveColor(color.value)}
                title={color.label}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 border-r pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Deshacer"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Rehacer"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 border-r pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAnnotations}
            className="text-destructive"
            title="Borrar todas las anotaciones"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Área de visualización del PDF */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4" ref={containerRef}>
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
              <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
              <p className="text-lg">Cargando PDF...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-white rounded-lg shadow-lg p-8">
              <div className="text-center max-w-md space-y-4">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-destructive">No se pudo cargar el PDF</h3>
                <p className="text-muted-foreground">{loadError}</p>
                
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold mb-2">🔧 Solución:</h4>
                  <p className="text-sm text-left">
                    El backend de Supabase no está configurado. Para que los archivos PDF funcionen correctamente, necesitas:
                  </p>
                  <ol className="text-sm text-left list-decimal list-inside mt-2 space-y-1">
                    <li>Configurar Supabase Storage</li>
                    <li>Crear las Edge Functions necesarias</li>
                    <li>O usar Data URLs (sin backend)</li>
                  </ol>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cerrar
                  </Button>
                  <Button onClick={() => loadPDF()} className="flex-1">
                    Reintentar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-white shadow-2xl" style={{ display: 'inline-block' }}>
              <canvas ref={canvasRef} className="block" />
              <canvas
                ref={overlayCanvasRef}
                className={`absolute top-0 left-0 ${getCursorClass()}`}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={(e) => {
                  handleCanvasMouseUp(e);
                  setHoveredAnnotation(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navegación de páginas */}
      <div className="border-t bg-card p-3 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          Página {currentPage} de {totalPages}
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

      {/* Modal de comentario */}
      {showCommentInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Agregar Comentario</h3>
            <div className="relative">
              <textarea
                className="w-full border rounded-md p-2 min-h-[100px] mb-2"
                placeholder="Escribe tu comentario aquí... (máximo 150 caracteres)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={150}
                autoFocus
              />
              <div className="text-xs text-muted-foreground text-right mb-4">
                {commentText.length}/150 caracteres
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentInput(false);
                  setCommentText('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                Agregar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de texto */}
      {showTextInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Agregar Texto</h3>
            <textarea
              className="w-full border rounded-md p-2 min-h-[100px] mb-4"
              placeholder="Escribe tu texto aquí..."
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTextInput(false);
                  setTextInputValue('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddText} disabled={!textInputValue.trim()}>
                Agregar
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Modal de confirmación de borrado */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar Borrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ¿Estás seguro de que quieres borrar todas las anotaciones?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmClearAnnotations}
              >
                Borrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}