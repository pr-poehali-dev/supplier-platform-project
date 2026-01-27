import { Button } from '@/components/ui/button';
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
    // Случайная выборка 4-6 вопросов
    const shuffled = [...QUESTIONS_POOL].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 3) + 4; // 4-6 вопросов
    setQuestions(shuffled.slice(0, count));
  }, []);

  return (
    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
      <p className="text-xs font-medium text-gray-500 mb-2">Быстрые вопросы</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, idx) => (
          <Button
            key={idx}
            variant="ghost"
            size="sm"
            onClick={() => onQuestionClick(question)}
            className="h-auto py-1.5 px-3 text-xs bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-gray-700 font-normal transition-all hover:scale-105 hover:shadow-sm"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
