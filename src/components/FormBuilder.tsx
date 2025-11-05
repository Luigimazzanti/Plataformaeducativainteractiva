import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Plus, Trash2, GripVertical, Type, CheckSquare, Circle, Calendar, Upload } from 'lucide-react';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file';
  label: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: newFieldType,
      label: '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(newFieldType) ? ['Opción 1'] : undefined,
    };
    onChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map((field) => (field.id === id ? { ...field, ...updates } : field)));
  };

  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  const addOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.options) {
      updateField(fieldId, {
        options: [...field.options, `Opción ${field.options.length + 1}`],
      });
    }
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.options) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = value;
      updateField(fieldId, { options: newOptions });
    }
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.options) {
      updateField(fieldId, {
        options: field.options.filter((_, i) => i !== optionIndex),
      });
    }
  };

  const getFieldIcon = (type: FormField['type']) => {
    switch (type) {
      case 'text':
      case 'textarea':
        return <Type className="w-4 h-4" />;
      case 'checkbox':
        return <CheckSquare className="w-4 h-4" />;
      case 'radio':
        return <Circle className="w-4 h-4" />;
      case 'date':
        return <Calendar className="w-4 h-4" />;
      case 'file':
        return <Upload className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto corto</SelectItem>
            <SelectItem value="textarea">Texto largo</SelectItem>
            <SelectItem value="select">Selección</SelectItem>
            <SelectItem value="radio">Opción múltiple</SelectItem>
            <SelectItem value="checkbox">Casillas</SelectItem>
            <SelectItem value="date">Fecha</SelectItem>
            <SelectItem value="file">Archivo</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" onClick={addField} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Agregar Campo
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-600">Agrega campos para crear tu formulario</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card key={field.id} className="bg-gradient-to-r from-green-50 to-cyan-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="pt-2 cursor-move">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded">
                        {getFieldIcon(field.type)}
                      </div>
                      <Input
                        placeholder="Etiqueta del campo"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="flex-1 bg-white"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded"
                        />
                        Requerido
                      </label>
                    </div>

                    {field.options && (
                      <div className="space-y-2 ml-11">
                        <Label className="text-xs text-gray-600">Opciones:</Label>
                        {field.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(field.id, optIndex, e.target.value)}
                              placeholder={`Opción ${optIndex + 1}`}
                              className="bg-white"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(field.id, optIndex)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(field.id)}
                          className="ml-0"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar Opción
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
