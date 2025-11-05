import { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Award, Sparkles } from 'lucide-react';
import { InteractiveActivity } from './InteractiveFormBuilder';

interface InteractiveActivityRendererProps {
  activity: InteractiveActivity;
  onComplete?: (score: number) => void;
  readonly?: boolean;
  submittedAnswers?: any;
}

export function InteractiveActivityRenderer({
  activity,
  onComplete,
  readonly = false,
  submittedAnswers
}: InteractiveActivityRendererProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {activity.title || 'Actividad Interactiva'}
              </CardTitle>
              {activity.description && (
                <p className="text-sm text-white/90 mt-2">{activity.description}</p>
              )}
            </div>
            {activity.points && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {activity.points} puntos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {activity.type === 'fill-blanks' && (
            <FillBlanksActivity
              content={activity.content}
              onComplete={onComplete}
              readonly={readonly}
              submittedAnswers={submittedAnswers}
            />
          )}
          {activity.type === 'match-pairs' && (
            <MatchPairsActivity
              content={activity.content}
              onComplete={onComplete}
              readonly={readonly}
              submittedAnswers={submittedAnswers}
            />
          )}
          {activity.type === 'sequence' && (
            <SequenceActivity
              content={activity.content}
              onComplete={onComplete}
              readonly={readonly}
              submittedAnswers={submittedAnswers}
            />
          )}
          {activity.type === 'categorize' && (
            <CategorizeActivity
              content={activity.content}
              onComplete={onComplete}
              readonly={readonly}
              submittedAnswers={submittedAnswers}
            />
          )}
          {activity.type === 'true-false' && (
            <TrueFalseActivity
              content={activity.content}
              onComplete={onComplete}
              readonly={readonly}
              submittedAnswers={submittedAnswers}
            />
          )}
          {activity.type === 'image-choice' && (
            <ImageChoiceActivity
              content={activity.content}
              onComplete={onComplete}
              readonly={readonly}
              submittedAnswers={submittedAnswers}
            />
          )}
        </CardContent>
      </Card>
    </DndProvider>
  );
}

// Actividad: Rellenar espacios vacíos
function FillBlanksActivity({ content, onComplete, readonly, submittedAnswers }: any) {
  const [blanks, setBlanks] = useState<(string | null)[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (submittedAnswers) {
      setBlanks(submittedAnswers.blanks || []);
      setShowResult(true);
    } else {
      const blankCount = (content.text?.match(/___BLANK___/g) || []).length;
      setBlanks(new Array(blankCount).fill(null));
      setAvailableWords([...(content.words || [])].sort(() => Math.random() - 0.5));
    }
  }, [content, submittedAnswers]);

  const handleDrop = (blankIndex: number, word: string) => {
    if (readonly) return;
    
    const newBlanks = [...blanks];
    const oldWord = newBlanks[blankIndex];
    newBlanks[blankIndex] = word;
    setBlanks(newBlanks);

    const newAvailableWords = availableWords.filter(w => w !== word);
    if (oldWord) {
      newAvailableWords.push(oldWord);
    }
    setAvailableWords(newAvailableWords);
  };

  const handleRemoveFromBlank = (blankIndex: number) => {
    if (readonly) return;
    
    const word = blanks[blankIndex];
    if (word) {
      const newBlanks = [...blanks];
      newBlanks[blankIndex] = null;
      setBlanks(newBlanks);
      setAvailableWords([...availableWords, word]);
    }
  };

  const handleSubmit = () => {
    setShowResult(true);
    if (onComplete) {
      const score = blanks.every(b => b !== null) ? 100 : 0;
      onComplete(score);
    }
  };

  const parts = content.text?.split('___BLANK___') || [];

  return (
    <div className="space-y-6">
      <div className="text-lg leading-relaxed">
        {parts.map((part: string, index: number) => (
          <span key={index}>
            {part}
            {index < blanks.length && (
              <BlankSpace
                word={blanks[index]}
                onDrop={(word) => handleDrop(index, word)}
                onRemove={() => handleRemoveFromBlank(index)}
                readonly={readonly}
                showResult={showResult}
              />
            )}
          </span>
        ))}
      </div>

      {!readonly && !showResult && (
        <>
          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground mb-3">
              Arrastra las palabras a los espacios vacíos:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableWords.map((word, index) => (
                <DraggableWord key={`${word}-${index}`} word={word} />
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={blanks.some(b => b === null)}
            className="w-full"
          >
            Verificar Respuestas
          </Button>
        </>
      )}

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 p-4 bg-primary/10 border border-primary rounded-lg"
        >
          <Award className="w-5 h-5 text-primary" />
          <p className="font-medium text-primary">
            {blanks.every(b => b !== null) ? '¡Completado!' : 'Actividad enviada'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function DraggableWord({ word }: { word: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'word',
    item: { word },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <motion.div
      ref={drag}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-2 bg-gradient-to-r from-secondary to-cyan-500 text-white rounded-lg cursor-move shadow-md transition-opacity ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {word}
    </motion.div>
  );
}

function BlankSpace({ word, onDrop, onRemove, readonly, showResult }: any) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'word',
    drop: (item: { word: string }) => onDrop(item.word),
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <span
      ref={drop}
      onClick={word && !readonly ? onRemove : undefined}
      className={`inline-flex items-center gap-1 mx-1 px-3 py-1 min-w-[120px] rounded-lg border-2 border-dashed transition-all ${
        word
          ? 'bg-primary/10 border-primary cursor-pointer hover:bg-primary/20'
          : isOver
          ? 'bg-secondary/20 border-secondary'
          : 'bg-gray-100 border-gray-300'
      }`}
    >
      {word || (
        <span className="text-gray-400 text-sm">_______</span>
      )}
    </span>
  );
}

// Actividad: Conectar parejas
function MatchPairsActivity({ content, onComplete, readonly, submittedAnswers }: any) {
  const [connections, setConnections] = useState<Map<number, number>>(new Map());
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shuffledRight, setShuffledRight] = useState<any[]>([]);

  useEffect(() => {
    if (submittedAnswers) {
      setConnections(new Map(submittedAnswers.connections || []));
      setShowResult(true);
    } else {
      const rightItems = [...(content.pairs || [])];
      setShuffledRight(rightItems.sort(() => Math.random() - 0.5));
    }
  }, [content, submittedAnswers]);

  const handleLeftClick = (index: number) => {
    if (readonly || showResult) return;
    setSelectedLeft(index);
  };

  const handleRightClick = (rightIndex: number) => {
    if (readonly || showResult || selectedLeft === null) return;
    
    const newConnections = new Map(connections);
    newConnections.set(selectedLeft, rightIndex);
    setConnections(newConnections);
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    setShowResult(true);
    if (onComplete) {
      let correct = 0;
      connections.forEach((rightIndex, leftIndex) => {
        if (content.pairs[leftIndex].right === shuffledRight[rightIndex].right) {
          correct++;
        }
      });
      const score = (correct / content.pairs.length) * 100;
      onComplete(score);
    }
  };

  const isCorrectConnection = (leftIndex: number, rightIndex: number) => {
    return content.pairs[leftIndex].right === shuffledRight[rightIndex].right;
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Haz clic en un elemento de la izquierda, luego en su pareja de la derecha
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {content.pairs?.map((pair: any, index: number) => (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleLeftClick(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                selectedLeft === index
                  ? 'bg-primary text-white shadow-lg'
                  : connections.has(index)
                  ? showResult && isCorrectConnection(index, connections.get(index)!)
                    ? 'bg-green-100 border-2 border-green-500'
                    : showResult
                    ? 'bg-red-100 border-2 border-red-500'
                    : 'bg-secondary/20 border-2 border-secondary'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {pair.left}
              {showResult && connections.has(index) && (
                <span className="ml-2">
                  {isCorrectConnection(index, connections.get(index)!) ? '✓' : '✗'}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        <div className="space-y-2">
          {shuffledRight.map((pair: any, index: number) => {
            const isConnected = Array.from(connections.values()).includes(index);
            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => handleRightClick(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  isConnected
                    ? 'bg-secondary/20 border-2 border-secondary'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {pair.right}
              </motion.button>
            );
          })}
        </div>
      </div>

      {!readonly && !showResult && (
        <Button
          onClick={handleSubmit}
          disabled={connections.size !== content.pairs?.length}
          className="w-full"
        >
          Verificar Conexiones
        </Button>
      )}

      {showResult && (
        <ResultDisplay connections={connections} pairs={content.pairs} shuffledRight={shuffledRight} />
      )}
    </div>
  );
}

function ResultDisplay({ connections, pairs, shuffledRight }: any) {
  let correct = 0;
  connections.forEach((rightIndex: number, leftIndex: number) => {
    if (pairs[leftIndex].right === shuffledRight[rightIndex].right) {
      correct++;
    }
  });
  const percentage = (correct / pairs.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border-2 ${
        percentage === 100
          ? 'bg-green-50 border-green-500'
          : 'bg-amber-50 border-amber-500'
      }`}
    >
      <div className="flex items-center gap-2">
        {percentage === 100 ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <Award className="w-5 h-5 text-amber-600" />
        )}
        <p className="font-medium">
          {correct} de {pairs.length} correctas ({percentage.toFixed(0)}%)
        </p>
      </div>
    </motion.div>
  );
}

// Actividad: Ordenar secuencia
function SequenceActivity({ content, onComplete, readonly, submittedAnswers }: any) {
  const [items, setItems] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (submittedAnswers) {
      setItems(submittedAnswers.items || []);
      setShowResult(true);
    } else {
      setItems([...(content.items || [])].sort(() => Math.random() - 0.5));
    }
  }, [content, submittedAnswers]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (readonly || showResult) return;
    
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  };

  const handleSubmit = () => {
    setShowResult(true);
    if (onComplete) {
      const isCorrect = items.every((item, index) => item === content.items[index]);
      onComplete(isCorrect ? 100 : 0);
    }
  };

  const isItemCorrect = (item: string, index: number) => {
    return item === content.items[index];
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Arrastra los elementos para ordenarlos correctamente
      </p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <DraggableSequenceItem
            key={`${item}-${index}`}
            item={item}
            index={index}
            moveItem={moveItem}
            readonly={readonly || showResult}
            isCorrect={showResult ? isItemCorrect(item, index) : undefined}
          />
        ))}
      </div>

      {!readonly && !showResult && (
        <Button onClick={handleSubmit} className="w-full">
          Verificar Orden
        </Button>
      )}

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 ${
            items.every((item, index) => item === content.items[index])
              ? 'bg-green-50 border-green-500'
              : 'bg-amber-50 border-amber-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {items.every((item, index) => item === content.items[index]) ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="font-medium text-green-700">¡Orden perfecto!</p>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-amber-600" />
                <p className="font-medium text-amber-700">Revisa el orden</p>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DraggableSequenceItem({ item, index, moveItem, readonly, isCorrect }: any) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'sequence-item',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: !readonly
  }));

  const [, drop] = useDrop(() => ({
    accept: 'sequence-item',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    }
  }));

  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 p-4 rounded-lg cursor-move transition-all ${
        isDragging
          ? 'opacity-50'
          : isCorrect === true
          ? 'bg-green-100 border-2 border-green-500'
          : isCorrect === false
          ? 'bg-red-100 border-2 border-red-500'
          : 'bg-gradient-to-r from-teal-50 to-emerald-50 hover:shadow-md'
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm font-medium text-sm">
        {index + 1}
      </div>
      <p className="flex-1">{item}</p>
      {isCorrect !== undefined && (
        <span className="text-lg">
          {isCorrect ? '✓' : '✗'}
        </span>
      )}
    </motion.div>
  );
}

// Actividad: Categorizar
function CategorizeActivity({ content, onComplete, readonly, submittedAnswers }: any) {
  const [categorized, setCategorized] = useState<Map<string, string[]>>(new Map());
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (submittedAnswers) {
      setCategorized(new Map(submittedAnswers.categorized || []));
      setShowResult(true);
    } else {
      const initial = new Map();
      content.categories?.forEach((cat: string) => {
        initial.set(cat, []);
      });
      setCategorized(initial);
      setAvailableItems([...(content.items || [])].sort(() => Math.random() - 0.5));
    }
  }, [content, submittedAnswers]);

  const handleDrop = (category: string, item: string) => {
    if (readonly || showResult) return;
    
    const newCategorized = new Map(categorized);
    const newAvailable = availableItems.filter(i => i !== item);
    
    newCategorized.get(category)?.push(item);
    setCategorized(newCategorized);
    setAvailableItems(newAvailable);
  };

  const handleRemove = (category: string, item: string) => {
    if (readonly || showResult) return;
    
    const newCategorized = new Map(categorized);
    const items = newCategorized.get(category) || [];
    newCategorized.set(category, items.filter(i => i !== item));
    setCategorized(newCategorized);
    setAvailableItems([...availableItems, item]);
  };

  const handleSubmit = () => {
    setShowResult(true);
    if (onComplete) {
      onComplete(100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        {content.categories?.map((category: string) => (
          <CategoryZone
            key={category}
            category={category}
            items={categorized.get(category) || []}
            onDrop={handleDrop}
            onRemove={handleRemove}
            readonly={readonly || showResult}
          />
        ))}
      </div>

      {!readonly && !showResult && (
        <>
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Elementos sin categorizar:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableItems.map((item, index) => (
                <DraggableCategoryItem key={`${item}-${index}`} item={item} />
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={availableItems.length > 0}
            className="w-full"
          >
            Verificar Categorización
          </Button>
        </>
      )}

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 p-4 bg-primary/10 border border-primary rounded-lg"
        >
          <Award className="w-5 h-5 text-primary" />
          <p className="font-medium text-primary">¡Categorización completada!</p>
        </motion.div>
      )}
    </div>
  );
}

function CategoryZone({ category, items, onDrop, onRemove, readonly }: any) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'category-item',
    drop: (item: { item: string }) => onDrop(category, item.item),
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop}
      className={`p-4 rounded-lg border-2 border-dashed min-h-[150px] transition-all ${
        isOver
          ? 'bg-amber-100 border-amber-500'
          : 'bg-gray-50 border-gray-300'
      }`}
    >
      <h4 className="font-medium mb-3 text-amber-700">{category}</h4>
      <div className="space-y-2">
        {items.map((item: string, index: number) => (
          <div
            key={`${item}-${index}`}
            onClick={() => !readonly && onRemove(category, item)}
            className={`p-2 bg-white rounded-lg shadow-sm ${
              readonly ? '' : 'cursor-pointer hover:bg-gray-50'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function DraggableCategoryItem({ item }: { item: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'category-item',
    item: { item },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <motion.div
      ref={drag}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg cursor-move shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {item}
    </motion.div>
  );
}

// Actividad: Verdadero/Falso
function TrueFalseActivity({ content, onComplete, readonly, submittedAnswers }: any) {
  const [answers, setAnswers] = useState<Map<number, boolean>>(new Map());
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (submittedAnswers) {
      setAnswers(new Map(submittedAnswers.answers || []));
      setShowResult(true);
    }
  }, [submittedAnswers]);

  const handleAnswer = (index: number, answer: boolean) => {
    if (readonly || showResult) return;
    
    const newAnswers = new Map(answers);
    newAnswers.set(index, answer);
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setShowResult(true);
    if (onComplete) {
      let correct = 0;
      answers.forEach((answer, index) => {
        if (answer === content.statements[index].correct) {
          correct++;
        }
      });
      const score = (correct / content.statements.length) * 100;
      onComplete(score);
    }
  };

  return (
    <div className="space-y-4">
      {content.statements?.map((statement: any, index: number) => {
        const userAnswer = answers.get(index);
        const isCorrect = userAnswer === statement.correct;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 ${
              showResult
                ? isCorrect
                  ? 'bg-green-50 border-green-500'
                  : userAnswer !== undefined
                  ? 'bg-red-50 border-red-500'
                  : 'bg-gray-50 border-gray-300'
                : userAnswer !== undefined
                ? 'bg-purple-50 border-purple-500'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <p className="mb-3">{statement.text}</p>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => handleAnswer(index, true)}
                disabled={readonly || showResult}
                variant={userAnswer === true ? 'default' : 'outline'}
                className={`flex-1 ${
                  userAnswer === true
                    ? 'bg-primary hover:bg-primary'
                    : ''
                }`}
              >
                ✓ Verdadero
              </Button>
              <Button
                type="button"
                onClick={() => handleAnswer(index, false)}
                disabled={readonly || showResult}
                variant={userAnswer === false ? 'destructive' : 'outline'}
                className="flex-1"
              >
                ✗ Falso
              </Button>
            </div>
            {showResult && (
              <p className="mt-2 text-sm font-medium">
                {isCorrect ? (
                  <span className="text-green-600">✓ Correcto</span>
                ) : userAnswer !== undefined ? (
                  <span className="text-red-600">
                    ✗ Incorrecto - La respuesta correcta es: {statement.correct ? 'Verdadero' : 'Falso'}
                  </span>
                ) : (
                  <span className="text-gray-600">Sin responder</span>
                )}
              </p>
            )}
          </motion.div>
        );
      })}

      {!readonly && !showResult && (
        <Button
          onClick={handleSubmit}
          disabled={answers.size !== content.statements?.length}
          className="w-full"
        >
          Verificar Respuestas
        </Button>
      )}

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-purple-50 border-2 border-purple-500 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <p className="font-medium text-purple-700">
              {Array.from(answers.values()).filter((answer, index) => 
                answer === content.statements[index].correct
              ).length} de {content.statements.length} correctas
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Actividad: Selección con imágenes
function ImageChoiceActivity({ content, onComplete, readonly, submittedAnswers }: any) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (submittedAnswers) {
      setSelectedOption(submittedAnswers.selectedOption);
      setShowResult(true);
    }
  }, [submittedAnswers]);

  const handleSelect = (index: number) => {
    if (readonly || showResult) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    setShowResult(true);
    if (onComplete && selectedOption !== null) {
      const isCorrect = content.options[selectedOption].correct;
      onComplete(isCorrect ? 100 : 0);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-center">{content.question}</h3>

      <div className="grid md:grid-cols-2 gap-4">
        {content.options?.map((option: any, index: number) => {
          const isSelected = selectedOption === index;
          const isCorrect = option.correct;

          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleSelect(index)}
              whileHover={{ scale: readonly || showResult ? 1 : 1.02 }}
              whileTap={{ scale: readonly || showResult ? 1 : 0.98 }}
              className={`p-4 rounded-xl border-4 transition-all ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : isSelected
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.imageUrl && (
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={option.imageUrl}
                    alt={option.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagen%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              )}
              <p className="font-medium text-center">{option.label}</p>
              {showResult && isSelected && (
                <p className="mt-2 text-sm font-medium">
                  {isCorrect ? (
                    <span className="text-green-600">✓ Correcto</span>
                  ) : (
                    <span className="text-red-600">✗ Incorrecto</span>
                  )}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>

      {!readonly && !showResult && (
        <Button
          onClick={handleSubmit}
          disabled={selectedOption === null}
          className="w-full"
        >
          Verificar Respuesta
        </Button>
      )}
    </div>
  );
}
