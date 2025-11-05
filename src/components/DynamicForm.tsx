import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { InteractiveActivityRenderer } from './InteractiveActivityRenderer';
import { InteractiveActivity } from './InteractiveFormBuilder';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file';
  label: string;
  required: boolean;
  options?: string[];
}

interface DynamicFormProps {
  fields?: FormField[];
  interactiveActivities?: InteractiveActivity[];
  responses: any;
  onChange: (responses: any) => void;
  readOnly?: boolean;
}

export function DynamicForm({ fields, interactiveActivities, responses, onChange, readOnly = false }: DynamicFormProps) {
  const handleChange = (fieldId: string, value: any) => {
    if (readOnly) return;
    onChange({ ...responses, [fieldId]: value });
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    if (readOnly) return;
    const current = responses[fieldId] || [];
    const newValue = checked
      ? [...current, option]
      : current.filter((v: string) => v !== option);
    onChange({ ...responses, [fieldId]: newValue });
  };

  const handleActivityComplete = (activityId: string, score: number) => {
    if (readOnly) return;
    onChange({ 
      ...responses, 
      [`activity-${activityId}`]: { score, completed: true } 
    });
  };

  return (
    <div className="space-y-6">
      {/* Render interactive activities if they exist */}
      {interactiveActivities && interactiveActivities.length > 0 && (
        <div className="space-y-6">
          {interactiveActivities.map((activity) => (
            <InteractiveActivityRenderer
              key={activity.id}
              activity={activity}
              onComplete={(score) => handleActivityComplete(activity.id, score)}
              readonly={readOnly}
              submittedAnswers={responses[`activity-${activity.id}`]}
            />
          ))}
        </div>
      )}

      {/* Render traditional form fields if they exist */}
      {fields && fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {field.type === 'text' && (
            <Input
              value={responses[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              disabled={readOnly}
              placeholder={readOnly ? 'Sin respuesta' : 'Tu respuesta'}
            />
          )}

          {field.type === 'textarea' && (
            <Textarea
              value={responses[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              disabled={readOnly}
              rows={4}
              placeholder={readOnly ? 'Sin respuesta' : 'Tu respuesta'}
            />
          )}

          {field.type === 'select' && (
            <Select
              value={responses[field.id]}
              onValueChange={(value) => handleChange(field.id, value)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder={readOnly ? 'Sin respuesta' : 'Selecciona una opción'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === 'radio' && (
            <RadioGroup
              value={responses[field.id]}
              onValueChange={(value) => handleChange(field.id, value)}
              disabled={readOnly}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {field.type === 'checkbox' && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={(responses[field.id] || []).includes(option)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(field.id, option, checked as boolean)
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {field.type === 'date' && (
            <Input
              type="date"
              value={responses[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              disabled={readOnly}
            />
          )}

          {field.type === 'file' && !readOnly && (
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleChange(field.id, file.name);
              }}
              required={field.required}
              disabled={readOnly}
            />
          )}

          {field.type === 'file' && readOnly && (
            <p className="text-sm text-gray-600">{responses[field.id] || 'Sin archivo'}</p>
          )}
        </div>
      ))}
    </div>
  );
}
