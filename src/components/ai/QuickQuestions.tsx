import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface QuickQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const QUESTIONS_POOL = [
  // Загрузка и календарь
  'Какая загрузка на ближайший месяц?',
  'Кто заезжает в ближайшие даты?',
  'Есть ли свободные выходные?',
  'Какие даты сейчас самые загруженные?',
  
  // Доходы
  'Сколько мы заработали в этом месяце?',
  'Какой средний чек?',
  'Какой объект приносит больше всего?',
  
  // Объекты
  'Какие объекты сейчас доступны?',
  'Когда последний раз сдавалась баня?',
  'Какие объекты простаивают?',
  
  // Управление
  'Есть ли неоплаченные бронирования?',
  'Какие заявки требуют внимания?',
  'Были ли отмены недавно?'
];

export default function QuickQuestions({ onQuestionClick }: QuickQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    setQuestions(QUESTIONS_POOL);
  }, []);

  return (
    <Card className="w-[240px] h-[680px] shadow-xl border border-gray-200/80 bg-white overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-sm font-semibold text-gray-900">Быстрые вопросы</h3>
        <p className="text-xs text-gray-500 mt-0.5">Нажмите, чтобы спросить</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'thin' }}>
        {questions.map((question, idx) => (
          <Button
            key={idx}
            variant="ghost"
            onClick={() => onQuestionClick(question)}
            className="w-full h-auto py-2.5 px-3 text-xs text-left bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-gray-700 font-normal transition-all justify-start whitespace-normal"
          >
            {question}
          </Button>
        ))}
      </div>
    </Card>
  );
}