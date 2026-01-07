import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface Question {
  id: string;
  text: string;
  options: Array<{ value: number; label: string; icon: string }>;
}

interface Block {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: Question[];
}

const diagnosticsBlocks: Block[] = [
  {
    id: 'positioning',
    title: 'Формат и позиционирование',
    description: 'Понимание сути вашего бизнеса',
    icon: 'Target',
    questions: [
      {
        id: 'q1_1',
        text: 'Есть ли чётко описанная целевая аудитория?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Частично', icon: 'AlertCircle' },
          { value: 2, label: 'Да', icon: 'Check' }
        ]
      },
      {
        id: 'q1_2',
        text: 'Вы продаёте отдых или проживание?',
        options: [
          { value: 0, label: 'Проживание', icon: 'X' },
          { value: 1, label: 'Что-то среднее', icon: 'AlertCircle' },
          { value: 2, label: 'Готовый отдых', icon: 'Check' }
        ]
      },
      {
        id: 'q1_3',
        text: 'Понимаете ли вы, почему гости выбирают именно вас?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Частично', icon: 'AlertCircle' },
          { value: 2, label: 'Да', icon: 'Check' }
        ]
      },
      {
        id: 'q1_4',
        text: 'Отличаетесь ли вы от ближайших конкурентов?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Немного', icon: 'AlertCircle' },
          { value: 2, label: 'Да, явно', icon: 'Check' }
        ]
      },
      {
        id: 'q1_5',
        text: 'Есть ли у объекта упакованная концепция?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'В процессе', icon: 'AlertCircle' },
          { value: 2, label: 'Да', icon: 'Check' }
        ]
      }
    ]
  },
  {
    id: 'pricing',
    title: 'Цена и загрузка',
    description: 'Поиск потерь выручки',
    icon: 'DollarSign',
    questions: [
      {
        id: 'q2_1',
        text: 'Как формируется цена?',
        options: [
          { value: 0, label: 'Интуитивно', icon: 'X' },
          { value: 1, label: 'По рынку', icon: 'AlertCircle' },
          { value: 2, label: 'На основе экономики', icon: 'Check' }
        ]
      },
      {
        id: 'q2_2',
        text: 'Меняется ли цена по сезонам?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Немного', icon: 'AlertCircle' },
          { value: 2, label: 'Да, гибко', icon: 'Check' }
        ]
      },
      {
        id: 'q2_3',
        text: 'Средняя загрузка в высокий сезон?',
        options: [
          { value: 0, label: 'До 50%', icon: 'X' },
          { value: 1, label: '50-80%', icon: 'AlertCircle' },
          { value: 2, label: 'Выше 80%', icon: 'Check' }
        ]
      },
      {
        id: 'q2_4',
        text: 'Средняя загрузка в будни?',
        options: [
          { value: 0, label: 'До 30%', icon: 'X' },
          { value: 1, label: '30-60%', icon: 'AlertCircle' },
          { value: 2, label: 'Выше 60%', icon: 'Check' }
        ]
      },
      {
        id: 'q2_5',
        text: 'Используются ли минимальные сроки проживания?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Иногда', icon: 'AlertCircle' },
          { value: 2, label: 'Да, регулярно', icon: 'Check' }
        ]
      }
    ]
  },
  {
    id: 'seasonality',
    title: 'Сезонность и структура года',
    description: 'Сколько месяцев бизнес зарабатывает',
    icon: 'Calendar',
    questions: [
      {
        id: 'q3_1',
        text: 'Сколько месяцев в году объект зарабатывает?',
        options: [
          { value: 0, label: '3-4 месяца', icon: 'X' },
          { value: 1, label: '5-8 месяцев', icon: 'AlertCircle' },
          { value: 2, label: '9+ месяцев', icon: 'Check' }
        ]
      },
      {
        id: 'q3_2',
        text: 'Есть ли стратегия межсезонья?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'В разработке', icon: 'AlertCircle' },
          { value: 2, label: 'Да, работает', icon: 'Check' }
        ]
      },
      {
        id: 'q3_3',
        text: 'Есть ли продукты под будни?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Пробуем', icon: 'AlertCircle' },
          { value: 2, label: 'Да, регулярно', icon: 'Check' }
        ]
      },
      {
        id: 'q3_4',
        text: 'Насколько критичен один плохой сезон?',
        options: [
          { value: 0, label: 'Очень критичен', icon: 'X' },
          { value: 1, label: 'Ощутимо', icon: 'AlertCircle' },
          { value: 2, label: 'Переживём', icon: 'Check' }
        ]
      },
      {
        id: 'q3_5',
        text: 'Есть ли финансовая подушка?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: '1-2 месяца', icon: 'AlertCircle' },
          { value: 2, label: '3+ месяца', icon: 'Check' }
        ]
      }
    ]
  },
  {
    id: 'upsells',
    title: 'Продукт и допродажи',
    description: 'Недоиспользованный потенциал',
    icon: 'ShoppingBag',
    questions: [
      {
        id: 'q4_1',
        text: 'Есть ли допуслуги?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: '1-2 услуги', icon: 'AlertCircle' },
          { value: 2, label: 'Широкий выбор', icon: 'Check' }
        ]
      },
      {
        id: 'q4_2',
        text: 'Какую долю выручки дают допродажи?',
        options: [
          { value: 0, label: 'До 5%', icon: 'X' },
          { value: 1, label: '5-15%', icon: 'AlertCircle' },
          { value: 2, label: 'Выше 15%', icon: 'Check' }
        ]
      },
      {
        id: 'q4_3',
        text: 'Есть ли пакетные предложения?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Одно-два', icon: 'AlertCircle' },
          { value: 2, label: 'Да, несколько', icon: 'Check' }
        ]
      },
      {
        id: 'q4_4',
        text: 'Есть ли события / программы?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Иногда', icon: 'AlertCircle' },
          { value: 2, label: 'Регулярно', icon: 'Check' }
        ]
      },
      {
        id: 'q4_5',
        text: 'Упакован ли продукт или «гость сам разберётся»?',
        options: [
          { value: 0, label: 'Сам разберётся', icon: 'X' },
          { value: 1, label: 'Частично упакован', icon: 'AlertCircle' },
          { value: 2, label: 'Всё упаковано', icon: 'Check' }
        ]
      }
    ]
  },
  {
    id: 'service',
    title: 'Персонал и сервис',
    description: 'Риск сервисного провала',
    icon: 'Users',
    questions: [
      {
        id: 'q5_1',
        text: 'Соответствует ли персонал формату объекта?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'В основном', icon: 'AlertCircle' },
          { value: 2, label: 'Да', icon: 'Check' }
        ]
      },
      {
        id: 'q5_2',
        text: 'Есть ли стандарты сервиса?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Устные', icon: 'AlertCircle' },
          { value: 2, label: 'Прописаны', icon: 'Check' }
        ]
      },
      {
        id: 'q5_3',
        text: 'Кто управляет объектом ежедневно?',
        options: [
          { value: 0, label: 'Никто конкретно', icon: 'X' },
          { value: 1, label: 'Собственник', icon: 'AlertCircle' },
          { value: 2, label: 'Менеджер', icon: 'Check' }
        ]
      },
      {
        id: 'q5_4',
        text: 'Есть ли проблемы с текучкой персонала?',
        options: [
          { value: 0, label: 'Да, постоянно', icon: 'X' },
          { value: 1, label: 'Иногда', icon: 'AlertCircle' },
          { value: 2, label: 'Нет', icon: 'Check' }
        ]
      },
      {
        id: 'q5_5',
        text: 'Есть ли контроль качества обслуживания?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Иногда проверяем', icon: 'AlertCircle' },
          { value: 2, label: 'Да, регулярный', icon: 'Check' }
        ]
      }
    ]
  },
  {
    id: 'management',
    title: 'Управление и цифры',
    description: 'Уровень управляемости бизнеса',
    icon: 'BarChart',
    questions: [
      {
        id: 'q6_1',
        text: 'Считаете ли вы экономику регулярно?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Иногда', icon: 'AlertCircle' },
          { value: 2, label: 'Да, постоянно', icon: 'Check' }
        ]
      },
      {
        id: 'q6_2',
        text: 'Понимаете ли точку безубыточности?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Примерно', icon: 'AlertCircle' },
          { value: 2, label: 'Да, точно', icon: 'Check' }
        ]
      },
      {
        id: 'q6_3',
        text: 'Отслеживаете ли эффективность рекламы?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Частично', icon: 'AlertCircle' },
          { value: 2, label: 'Да, по каналам', icon: 'Check' }
        ]
      },
      {
        id: 'q6_4',
        text: 'Есть ли управленческая отчётность?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'Простая', icon: 'AlertCircle' },
          { value: 2, label: 'Да, полноценная', icon: 'Check' }
        ]
      },
      {
        id: 'q6_5',
        text: 'Есть ли план развития на год?',
        options: [
          { value: 0, label: 'Нет', icon: 'X' },
          { value: 1, label: 'В голове', icon: 'AlertCircle' },
          { value: 2, label: 'Да, прописан', icon: 'Check' }
        ]
      }
    ]
  }
];

const Diagnostics = () => {
  const navigate = useNavigate();
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [started, setStarted] = useState(false);

  const currentBlock = diagnosticsBlocks[currentBlockIndex];
  const progress = ((currentBlockIndex + 1) / diagnosticsBlocks.length) * 100;
  const totalQuestions = diagnosticsBlocks.reduce((sum, block) => sum + block.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const blockAnswered = currentBlock.questions.every(q => answers[q.id] !== undefined);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentBlockIndex < diagnosticsBlocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      navigate('/diagnostics/results', { state: { answers } });
    }
  };

  const handleBack = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <Icon name="ArrowLeft" className="group-hover:-translate-x-1 transition-transform" size={20} />
              <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                TourConnect
              </h1>
            </button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Icon name="Sparkles" size={16} />
              Бесплатная диагностика
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
              Диагностика туристического бизнеса
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Найдите точки потери и роста выручки за 10 минут
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Что вы получите:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Icon name="CheckCircle" className="text-green-500 flex-shrink-0" size={24} />
                <div>
                  <p className="font-medium">Карта рисков и точек роста</p>
                  <p className="text-sm text-gray-600">Структурированный анализ по 6 блокам</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Icon name="Target" className="text-blue-500 flex-shrink-0" size={24} />
                <div>
                  <p className="font-medium">3 ключевые проблемы</p>
                  <p className="text-sm text-gray-600">То, что тормозит развитие прямо сейчас</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Icon name="TrendingUp" className="text-purple-500 flex-shrink-0" size={24} />
                <div>
                  <p className="font-medium">3 точки роста</p>
                  <p className="text-sm text-gray-600">Приоритетные направления для увеличения выручки</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Icon name="MessageSquare" className="text-orange-500 flex-shrink-0" size={24} />
                <div>
                  <p className="font-medium">Экспертные комментарии</p>
                  <p className="text-sm text-gray-600">Профессиональная оценка без мотивационного мусора</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6 блоков диагностики:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {diagnosticsBlocks.map(block => (
                  <div key={block.id} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                    <Icon name={block.icon as any} className="text-primary flex-shrink-0" size={24} />
                    <div>
                      <p className="font-medium text-sm">{block.title}</p>
                      <p className="text-xs text-gray-600">{block.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <div className="flex gap-3">
              <Icon name="AlertTriangle" className="text-amber-600 flex-shrink-0" size={24} />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-2">Дисклеймер:</p>
                <p>
                  Диагностика носит ознакомительный характер и не является аудитом, бизнес-планом или консультацией.
                  Результаты предназначены для понимания текущего состояния проекта.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setStarted(true)}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white text-lg py-6"
            size="lg"
          >
            Начать диагностику
            <Icon name="ArrowRight" className="ml-2" size={20} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                TourConnect
              </h1>
            </button>
            <div className="text-sm text-gray-600">
              {answeredQuestions} / {totalQuestions} вопросов
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <Badge className="mb-4">
            Блок {currentBlockIndex + 1} из {diagnosticsBlocks.length}
          </Badge>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon name={currentBlock.icon as any} className="text-primary" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-heading mb-2">{currentBlock.title}</h2>
              <p className="text-gray-600">{currentBlock.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {currentBlock.questions.map((question, index) => (
            <Card key={question.id} className={answers[question.id] !== undefined ? 'border-primary/50' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {index + 1}. {question.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {question.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(question.id, option.value)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        answers[question.id] === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answers[question.id] === option.value
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}
                      >
                        {answers[question.id] === option.value && (
                          <Icon name="Check" className="text-white" size={16} />
                        )}
                      </div>
                      <Icon
                        name={option.icon as any}
                        className={
                          option.value === 0
                            ? 'text-red-500'
                            : option.value === 1
                            ? 'text-yellow-500'
                            : 'text-green-500'
                        }
                        size={20}
                      />
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          {currentBlockIndex > 0 && (
            <Button onClick={handleBack} variant="outline" size="lg">
              <Icon name="ArrowLeft" className="mr-2" size={20} />
              Назад
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!blockAnswered}
            className="flex-1 bg-gradient-to-r from-primary to-secondary"
            size="lg"
          >
            {currentBlockIndex < diagnosticsBlocks.length - 1 ? 'Следующий блок' : 'Показать результаты'}
            <Icon name="ArrowRight" className="ml-2" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
