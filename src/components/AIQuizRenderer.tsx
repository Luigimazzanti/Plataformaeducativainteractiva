import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Check, X, Trophy } from 'lucide-react';

interface AIQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | string | boolean;
  explanation?: string;
  points: number;
}

interface AIQuizRendererProps {
  questions: AIQuestion[];
  isTeacher?: boolean;
  onSubmit?: (data: { answers: Record<string, any>; score: number; totalPoints: number }) => void;
}

export function AIQuizRenderer({ questions, isTeacher = false, onSubmit }: AIQuizRendererProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    let correctCount = 0;
    let earnedPoints = 0;

    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      const isCorrect = checkAnswer(q, userAnswer);
      
      if (isCorrect) {
        correctCount++;
        earnedPoints += q.points;
      }
    });

    setScore(earnedPoints);
    setSubmitted(true);

    if (onSubmit) {
      onSubmit({ answers, score: earnedPoints, totalPoints });
    }
  };

  const checkAnswer = (question: AIQuestion, userAnswer: any): boolean => {
    if (question.type === 'multiple-choice') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'true-false') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'fill-blank' || question.type === 'short-answer') {
      const correct = String(question.correctAnswer).toLowerCase().trim();
      const user = String(userAnswer || '').toLowerCase().trim();
      return correct === user;
    }
    return false;
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      {!isTeacher && !submitted && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm">
              <strong>Total de preguntas:</strong> {questions.length} | 
              <strong className="ml-2">Puntos totales:</strong> {totalPoints}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      {questions.map((question, index) => (
        <QuestionItem
          key={question.id}
          question={question}
          index={index}
          userAnswer={answers[question.id]}
          onAnswer={(answer) => handleAnswer(question.id, answer)}
          isTeacher={isTeacher}
          submitted={submitted}
        />
      ))}

      {/* Submit Button */}
      {!isTeacher && !submitted && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={handleSubmit} 
            size="lg"
            disabled={Object.keys(answers).length !== questions.length}
            className="bg-[#84cc16] hover:bg-[#84cc16]/90"
          >
            <Check className="h-5 w-5 mr-2" />
            Enviar Respuestas
          </Button>
        </div>
      )}

      {/* Results */}
      {submitted && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
          <CardContent className="p-6 text-center">
            <Trophy className="h-16 w-16 text-[#84cc16] mx-auto mb-4" />
            <h3 className="text-2xl mb-2">¡Ejercicio Completado!</h3>
            <p className="text-lg">
              Puntuación: <strong>{score} / {totalPoints}</strong> puntos
            </p>
            <p className="text-muted-foreground mt-2">
              {Math.round((score / totalPoints) * 100)}% correcto
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuestionItem({
  question,
  index,
  userAnswer,
  onAnswer,
  isTeacher,
  submitted,
}: {
  question: AIQuestion;
  index: number;
  userAnswer: any;
  onAnswer: (answer: any) => void;
  isTeacher: boolean;
  submitted: boolean;
}) {
  const typeLabels = {
    'multiple-choice': 'Opción Múltiple',
    'fill-blank': 'Rellenar Blancos',
    'true-false': 'Verdadero/Falso',
    'short-answer': 'Respuesta Corta',
  };

  const isCorrect = submitted ? checkAnswer(question, userAnswer) : false;

  function checkAnswer(q: AIQuestion, answer: any): boolean {
    if (q.type === 'multiple-choice') {
      return answer === q.correctAnswer;
    } else if (q.type === 'true-false') {
      return answer === q.correctAnswer;
    } else if (q.type === 'fill-blank' || q.type === 'short-answer') {
      const correct = String(q.correctAnswer).toLowerCase().trim();
      const user = String(answer || '').toLowerCase().trim();
      return correct === user;
    }
    return false;
  }

  return (
    <Card className={submitted ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Question Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">#{index + 1}</Badge>
                <Badge variant="secondary">{typeLabels[question.type]}</Badge>
                <Badge>{question.points} pt</Badge>
                {submitted && (
                  <Badge variant={isCorrect ? 'default' : 'destructive'}>
                    {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </Badge>
                )}
              </div>
              <p className="font-medium">{question.question}</p>
            </div>
          </div>

          <Separator />

          {/* Answer Area */}
          {question.type === 'multiple-choice' && question.options && (
            <RadioGroup
              value={String(userAnswer ?? '')}
              onValueChange={(value) => !submitted && onAnswer(parseInt(value))}
              disabled={submitted || isTeacher}
            >
              <div className="space-y-3">
                {question.options.map((option, i) => {
                  const isThisCorrect = i === question.correctAnswer;
                  const isUserSelected = userAnswer === i;

                  return (
                    <div
                      key={i}
                      className={`flex items-center space-x-2 p-3 rounded-lg border ${
                        submitted
                          ? isThisCorrect
                            ? 'bg-green-50 dark:bg-green-950/30 border-green-300'
                            : isUserSelected
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-300'
                            : ''
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value={String(i)} id={`q-${question.id}-${i}`} />
                      <Label
                        htmlFor={`q-${question.id}-${i}`}
                        className="flex-1 cursor-pointer"
                      >
                        {String.fromCharCode(65 + i)}. {option}
                        {submitted && isThisCorrect && ' ✓'}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          )}

          {question.type === 'fill-blank' && (
            <div>
              <Input
                placeholder="Escribe tu respuesta..."
                value={userAnswer || ''}
                onChange={(e) => !submitted && onAnswer(e.target.value)}
                disabled={submitted || isTeacher}
                className={submitted ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}
              />
              {submitted && !isCorrect && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Respuesta correcta: <strong>{question.correctAnswer as string}</strong>
                </p>
              )}
            </div>
          )}

          {question.type === 'true-false' && (
            <RadioGroup
              value={String(userAnswer ?? '')}
              onValueChange={(value) => !submitted && onAnswer(value === 'true')}
              disabled={submitted || isTeacher}
            >
              <div className="space-y-2">
                {[
                  { value: 'true', label: 'Verdadero' },
                  { value: 'false', label: 'Falso' },
                ].map((opt) => {
                  const isThisCorrect = (opt.value === 'true') === question.correctAnswer;
                  const isUserSelected = String(userAnswer) === opt.value;

                  return (
                    <div
                      key={opt.value}
                      className={`flex items-center space-x-2 p-3 rounded-lg border ${
                        submitted
                          ? isThisCorrect
                            ? 'bg-green-50 dark:bg-green-950/30 border-green-300'
                            : isUserSelected
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-300'
                            : ''
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`q-${question.id}-${opt.value}`} />
                      <Label
                        htmlFor={`q-${question.id}-${opt.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        {opt.label}
                        {submitted && isThisCorrect && ' ✓'}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          )}

          {question.type === 'short-answer' && (
            <div>
              <Input
                placeholder="Escribe tu respuesta..."
                value={userAnswer || ''}
                onChange={(e) => !submitted && onAnswer(e.target.value)}
                disabled={submitted || isTeacher}
                className={submitted ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}
              />
              {submitted && !isCorrect && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Respuesta esperada: <strong>{question.correctAnswer as string}</strong>
                </p>
              )}
            </div>
          )}

          {/* Explanation */}
          {submitted && question.explanation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 Explicación:</strong> {question.explanation}
              </p>
            </div>
          )}

          {/* Teacher View */}
          {isTeacher && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-sm text-green-900 dark:text-green-100">
                <strong>✓ Respuesta correcta:</strong>{' '}
                {question.type === 'multiple-choice' && question.options
                  ? question.options[question.correctAnswer as number]
                  : String(question.correctAnswer)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
