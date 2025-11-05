import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Plus, Trash2, GripVertical, Eye, Sparkles, 
  Target, Link2, ArrowUpDown, Layers, CircleDot,
  Image as ImageIcon, Gamepad2
} from 'lucide-react';
import { Textarea } from './ui/textarea';

export type InteractiveActivityType = 
  | 'fill-blanks'      // Arrastrar palabras a espacios vacíos
  | 'match-pairs'      // Conectar con flechas
  | 'sequence'         // Ordenar elementos
  | 'true-false'       // Verdadero/Falso visual
  | 'image-choice'     // Selección múltiple con imágenes
  | 'categorize';      // Clasificar en categorías

export interface InteractiveActivity {
  id: string;
  type: InteractiveActivityType;
  title: string;
  description?: string;
  content: any; // Contenido específico según el tipo
  points?: number;
}

interface InteractiveFormBuilderProps {
  activities: InteractiveActivity[];
  onChange: (activities: InteractiveActivity[]) => void;
}

export function InteractiveFormBuilder({ activities, onChange }: InteractiveFormBuilderProps) {
  const [selectedType, setSelectedType] = useState<InteractiveActivityType>('fill-blanks');
  const [showPreview, setShowPreview] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);

  const activityTypes = [
    {
      type: 'fill-blanks' as const,
      name: 'Rellenar Espacios',
      icon: <Target className="w-5 h-5" />,
      description: 'Arrastra palabras a los espacios vacíos',
      color: 'from-primary to-green-600'
    },
    {
      type: 'match-pairs' as const,
      name: 'Conectar Parejas',
      icon: <Link2 className="w-5 h-5" />,
      description: 'Conecta elementos con flechas',
      color: 'from-secondary to-cyan-600'
    },
    {
      type: 'sequence' as const,
      name: 'Ordenar',
      icon: <ArrowUpDown className="w-5 h-5" />,
      description: 'Ordena los elementos correctamente',
      color: 'from-teal-500 to-emerald-600'
    },
    {
      type: 'categorize' as const,
      name: 'Categorizar',
      icon: <Layers className="w-5 h-5" />,
      description: 'Clasifica en categorías',
      color: 'from-amber-500 to-orange-600'
    },
    {
      type: 'true-false' as const,
      name: 'Verdadero/Falso',
      icon: <CircleDot className="w-5 h-5" />,
      description: 'Responde verdadero o falso',
      color: 'from-purple-500 to-pink-600'
    },
    {
      type: 'image-choice' as const,
      name: 'Elección Visual',
      icon: <ImageIcon className="w-5 h-5" />,
      description: 'Selecciona la imagen correcta',
      color: 'from-blue-500 to-indigo-600'
    }
  ];

  const addActivity = (type: InteractiveActivityType) => {
    const newActivity: InteractiveActivity = {
      id: `activity-${Date.now()}`,
      type,
      title: '',
      description: '',
      points: 10,
      content: getDefaultContent(type)
    };
    onChange([...activities, newActivity]);
    setEditingActivity(newActivity.id);
  };

  const getDefaultContent = (type: InteractiveActivityType): any => {
    switch (type) {
      case 'fill-blanks':
        return {
          text: 'La capital de Francia es ___BLANK___ y la de España es ___BLANK___.',
          words: ['París', 'Madrid', 'Londres', 'Roma']
        };
      case 'match-pairs':
        return {
          pairs: [
            { left: 'Gato', right: 'Maullido' },
            { left: 'Perro', right: 'Ladrido' },
            { left: 'Pájaro', right: 'Canto' }
          ]
        };
      case 'sequence':
        return {
          items: ['Primero', 'Segundo', 'Tercero', 'Cuarto']
        };
      case 'categorize':
        return {
          categories: ['Categoría 1', 'Categoría 2'],
          items: ['Elemento 1', 'Elemento 2', 'Elemento 3', 'Elemento 4']
        };
      case 'true-false':
        return {
          statements: [
            { text: 'El sol es una estrella', correct: true },
            { text: 'La Tierra es plana', correct: false }
          ]
        };
      case 'image-choice':
        return {
          question: '¿Cuál es la imagen correcta?',
          options: [
            { imageUrl: '', label: 'Opción 1', correct: false },
            { imageUrl: '', label: 'Opción 2', correct: true }
          ]
        };
      default:
        return {};
    }
  };

  const updateActivity = (id: string, updates: Partial<InteractiveActivity>) => {
    onChange(activities.map(activity => 
      activity.id === id ? { ...activity, ...updates } : activity
    ));
  };

  const removeActivity = (id: string) => {
    onChange(activities.filter(activity => activity.id !== id));
    if (editingActivity === id) {
      setEditingActivity(null);
    }
  };

  const moveActivity = (index: number, direction: 'up' | 'down') => {
    const newActivities = [...activities];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newActivities.length) {
      [newActivities[index], newActivities[newIndex]] = [newActivities[newIndex], newActivities[index]];
      onChange(newActivities);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de preview */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Actividades Interactivas
          </h3>
          <p className="text-sm text-muted-foreground">
            Crea actividades visuales y dinámicas para tus estudiantes
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Ocultar' : 'Vista Previa'}
        </Button>
      </div>

      {/* Selector de tipo de actividad */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-green-50/50 to-cyan-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Agregar Nueva Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activityTypes.map((activityType) => (
              <button
                key={activityType.type}
                type="button"
                onClick={() => addActivity(activityType.type)}
                className={`group relative p-3 sm:p-4 rounded-xl bg-gradient-to-br ${activityType.color} text-white hover:scale-105 transition-all shadow-md hover:shadow-xl`}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                    {activityType.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{activityType.name}</p>
                    <p className="text-xs text-white/80 mt-1 line-clamp-2">{activityType.description}</p>
                  </div>
                </div>
                <Plus className="absolute top-2 right-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de actividades */}
      {activities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gamepad2 className="w-16 h-16 text-gray-400 mb-3" />
            <p className="text-gray-600 text-center">
              No hay actividades aún. <br />
              Selecciona un tipo de actividad arriba para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const activityTypeInfo = activityTypes.find(t => t.type === activity.type);
            const isEditing = editingActivity === activity.id;

            return (
              <Card key={activity.id} className="overflow-hidden">
                <div className={`bg-gradient-to-r ${activityTypeInfo?.color} p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveActivity(index, 'up')}
                        disabled={index === 0}
                        className="p-1 bg-white/20 rounded hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <GripVertical className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      {activityTypeInfo?.icon}
                    </div>
                    
                    <div className="flex-1 text-white">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activityTypeInfo?.name}</p>
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          Actividad {index + 1}
                        </Badge>
                        {activity.points && (
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            {activity.points} pts
                          </Badge>
                        )}
                      </div>
                      {activity.title && (
                        <p className="text-sm text-white/90 mt-1">{activity.title}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingActivity(isEditing ? null : activity.id)}
                        className="text-white hover:bg-white/20"
                      >
                        {isEditing ? 'Cerrar' : 'Editar'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(activity.id)}
                        className="text-white hover:bg-white/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <CardContent className="p-6 bg-gray-50">
                    <ActivityEditor
                      activity={activity}
                      onChange={(updates) => updateActivity(activity.id, updates)}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Editor específico para cada tipo de actividad
function ActivityEditor({ 
  activity, 
  onChange 
}: { 
  activity: InteractiveActivity; 
  onChange: (updates: Partial<InteractiveActivity>) => void;
}) {
  const updateContent = (updates: any) => {
    onChange({ content: { ...activity.content, ...updates } });
  };

  return (
    <div className="space-y-4">
      {/* Campos comunes */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Título de la actividad</Label>
          <Input
            value={activity.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Ej: Capitales de Europa"
          />
        </div>
        <div className="space-y-2">
          <Label>Puntos</Label>
          <Input
            type="number"
            value={activity.points || 10}
            onChange={(e) => onChange({ points: parseInt(e.target.value) || 10 })}
            min="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Instrucciones (opcional)</Label>
        <Textarea
          value={activity.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Instrucciones para el estudiante..."
          rows={2}
        />
      </div>

      {/* Editor específico según el tipo */}
      {activity.type === 'fill-blanks' && (
        <FillBlanksEditor content={activity.content} onChange={updateContent} />
      )}
      {activity.type === 'match-pairs' && (
        <MatchPairsEditor content={activity.content} onChange={updateContent} />
      )}
      {activity.type === 'sequence' && (
        <SequenceEditor content={activity.content} onChange={updateContent} />
      )}
      {activity.type === 'categorize' && (
        <CategorizeEditor content={activity.content} onChange={updateContent} />
      )}
      {activity.type === 'true-false' && (
        <TrueFalseEditor content={activity.content} onChange={updateContent} />
      )}
      {activity.type === 'image-choice' && (
        <ImageChoiceEditor content={activity.content} onChange={updateContent} />
      )}
    </div>
  );
}

// Editores específicos para cada tipo
function FillBlanksEditor({ content, onChange }: any) {
  const addWord = () => {
    onChange({ words: [...(content.words || []), 'Nueva palabra'] });
  };

  const updateWord = (index: number, value: string) => {
    const newWords = [...content.words];
    newWords[index] = value;
    onChange({ words: newWords });
  };

  const removeWord = (index: number) => {
    onChange({ words: content.words.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <p className="text-sm text-primary mb-2">💡 Tip: Usa ___BLANK___ para marcar los espacios vacíos</p>
      </div>
      
      <div className="space-y-2">
        <Label>Texto con espacios en blanco</Label>
        <Textarea
          value={content.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Ej: La capital de Francia es ___BLANK___ y la de España es ___BLANK___."
          rows={4}
          className="font-mono"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Palabras disponibles</Label>
          <Button type="button" variant="outline" size="sm" onClick={addWord}>
            <Plus className="w-3 h-3 mr-1" />
            Agregar palabra
          </Button>
        </div>
        <div className="grid gap-2">
          {content.words?.map((word: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={word}
                onChange={(e) => updateWord(index, e.target.value)}
                placeholder={`Palabra ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeWord(index)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchPairsEditor({ content, onChange }: any) {
  const addPair = () => {
    onChange({ 
      pairs: [...(content.pairs || []), { left: 'Elemento izquierdo', right: 'Elemento derecho' }] 
    });
  };

  const updatePair = (index: number, side: 'left' | 'right', value: string) => {
    const newPairs = [...content.pairs];
    newPairs[index][side] = value;
    onChange({ pairs: newPairs });
  };

  const removePair = (index: number) => {
    onChange({ pairs: content.pairs.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Parejas para conectar</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPair}>
          <Plus className="w-3 h-3 mr-1" />
          Agregar pareja
        </Button>
      </div>
      <div className="space-y-3">
        {content.pairs?.map((pair: any, index: number) => (
          <div key={index} className="flex gap-2 items-center p-3 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg">
            <Input
              value={pair.left}
              onChange={(e) => updatePair(index, 'left', e.target.value)}
              placeholder="Izquierda"
              className="flex-1 bg-white"
            />
            <Link2 className="w-5 h-5 text-primary flex-shrink-0" />
            <Input
              value={pair.right}
              onChange={(e) => updatePair(index, 'right', e.target.value)}
              placeholder="Derecha"
              className="flex-1 bg-white"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removePair(index)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SequenceEditor({ content, onChange }: any) {
  const addItem = () => {
    onChange({ items: [...(content.items || []), `Elemento ${(content.items?.length || 0) + 1}`] });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...content.items];
    newItems[index] = value;
    onChange({ items: newItems });
  };

  const removeItem = (index: number) => {
    onChange({ items: content.items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Elementos a ordenar (en orden correcto)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3 h-3 mr-1" />
          Agregar elemento
        </Button>
      </div>
      <div className="space-y-2">
        {content.items?.map((item: string, index: number) => (
          <div key={index} className="flex gap-2 items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm font-medium">
              {index + 1}
            </div>
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={`Elemento ${index + 1}`}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorizeEditor({ content, onChange }: any) {
  const addCategory = () => {
    onChange({ 
      categories: [...(content.categories || []), `Categoría ${(content.categories?.length || 0) + 1}`] 
    });
  };

  const updateCategory = (index: number, value: string) => {
    const newCategories = [...content.categories];
    newCategories[index] = value;
    onChange({ categories: newCategories });
  };

  const removeCategory = (index: number) => {
    onChange({ categories: content.categories.filter((_: any, i: number) => i !== index) });
  };

  const addItem = () => {
    onChange({ items: [...(content.items || []), `Elemento ${(content.items?.length || 0) + 1}`] });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...content.items];
    newItems[index] = value;
    onChange({ items: newItems });
  };

  const removeItem = (index: number) => {
    onChange({ items: content.items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Categorías</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCategory}>
            <Plus className="w-3 h-3 mr-1" />
            Agregar categoría
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {content.categories?.map((category: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={category}
                onChange={(e) => updateCategory(index, e.target.value)}
                placeholder={`Categoría ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCategory(index)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Elementos a clasificar</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-3 h-3 mr-1" />
            Agregar elemento
          </Button>
        </div>
        <div className="grid gap-2">
          {content.items?.map((item: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={`Elemento ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrueFalseEditor({ content, onChange }: any) {
  const addStatement = () => {
    onChange({ 
      statements: [...(content.statements || []), { text: 'Nueva afirmación', correct: true }] 
    });
  };

  const updateStatement = (index: number, field: 'text' | 'correct', value: any) => {
    const newStatements = [...content.statements];
    newStatements[index][field] = value;
    onChange({ statements: newStatements });
  };

  const removeStatement = (index: number) => {
    onChange({ statements: content.statements.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Afirmaciones</Label>
        <Button type="button" variant="outline" size="sm" onClick={addStatement}>
          <Plus className="w-3 h-3 mr-1" />
          Agregar afirmación
        </Button>
      </div>
      <div className="space-y-3">
        {content.statements?.map((statement: any, index: number) => (
          <div key={index} className="flex gap-2 items-start p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <Textarea
              value={statement.text}
              onChange={(e) => updateStatement(index, 'text', e.target.value)}
              placeholder="Afirmación..."
              rows={2}
              className="flex-1 bg-white"
            />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateStatement(index, 'correct', true)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    statement.correct
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ✓ Verdadero
                </button>
                <button
                  type="button"
                  onClick={() => updateStatement(index, 'correct', false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    !statement.correct
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ✗ Falso
                </button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStatement(index)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageChoiceEditor({ content, onChange }: any) {
  const updateQuestion = (value: string) => {
    onChange({ question: value });
  };

  const addOption = () => {
    onChange({ 
      options: [...(content.options || []), { imageUrl: '', label: 'Nueva opción', correct: false }] 
    });
  };

  const updateOption = (index: number, field: 'imageUrl' | 'label' | 'correct', value: any) => {
    const newOptions = [...content.options];
    if (field === 'correct' && value) {
      // Solo una opción puede ser correcta
      newOptions.forEach((opt, i) => {
        opt.correct = i === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    onChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    onChange({ options: content.options.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pregunta</Label>
        <Input
          value={content.question || ''}
          onChange={(e) => updateQuestion(e.target.value)}
          placeholder="¿Cuál es la imagen correcta?"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Opciones (imágenes)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="w-3 h-3 mr-1" />
            Agregar opción
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {content.options?.map((option: any, index: number) => (
            <div key={index} className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg space-y-2">
              <Input
                value={option.label}
                onChange={(e) => updateOption(index, 'label', e.target.value)}
                placeholder="Nombre de la opción"
                className="bg-white"
              />
              <Input
                value={option.imageUrl}
                onChange={(e) => updateOption(index, 'imageUrl', e.target.value)}
                placeholder="URL de la imagen"
                className="bg-white text-sm"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={option.correct}
                    onChange={(e) => updateOption(index, 'correct', e.target.checked)}
                    className="rounded"
                  />
                  Respuesta correcta
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
