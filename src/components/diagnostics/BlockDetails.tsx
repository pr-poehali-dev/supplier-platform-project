import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface BlockScore {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: 'critical' | 'medium' | 'good';
  icon: string;
}

interface BlockDetailsProps {
  blockScores: BlockScore[];
}

export default function BlockDetails({ blockScores }: BlockDetailsProps) {
  const getRecommendations = (blockId: string, level: string) => {
    const recommendations: Record<string, Record<string, string[]>> = {
      positioning: {
        critical: [
          'Определите целевую аудиторию и её боли',
          'Сформулируйте уникальное торговое предложение (УТП)',
          'Создайте концепцию, которая отличает вас от конкурентов'
        ],
        medium: [
          'Усильте коммуникацию ценности для гостей',
          'Доработайте визуальную идентичность',
          'Создайте эмоциональную привязку к бренду'
        ],
        good: [
          'Масштабируйте успешную модель',
          'Развивайте комьюнити вокруг бренда',
          'Тестируйте премиум-сегмент'
        ]
      },
      pricing: {
        critical: [
          'Рассчитайте точку безубыточности',
          'Внедрите сезонное ценообразование',
          'Изучите цены конкурентов в регионе'
        ],
        medium: [
          'Настройте динамическое ценообразование',
          'Создайте пакетные предложения',
          'Тестируйте цены в низкий сезон'
        ],
        good: [
          'Оптимизируйте Revenue Management',
          'Внедрите yield management',
          'Тестируйте премиум-тарифы'
        ]
      },
      seasonality: {
        critical: [
          'Разработайте продукты для межсезонья',
          'Привлеките корпоративных клиентов на будни',
          'Создайте событийные поводы для посещения'
        ],
        medium: [
          'Расширьте линейку услуг под разные сегменты',
          'Тестируйте акции в низкий сезон',
          'Добавьте всесезонные активности'
        ],
        good: [
          'Развивайте корпоративное направление',
          'Создавайте уникальные события',
          'Работайте с постоянными клиентами круглый год'
        ]
      },
      upsells: {
        critical: [
          'Внедрите базовые допродажи (питание, баня, мангал)',
          'Создайте прайс на дополнительные услуги',
          'Обучите персонал предлагать услуги'
        ],
        medium: [
          'Создайте готовые пакеты услуг',
          'Добавьте эксклюзивные опции',
          'Настройте upsell в процессе бронирования'
        ],
        good: [
          'Создайте VIP-пакеты с высокой маржой',
          'Тестируйте персонализированные предложения',
          'Развивайте партнёрства с локальными сервисами'
        ]
      },
      service: {
        critical: [
          'Создайте базовые стандарты сервиса',
          'Составьте чек-листы для персонала',
          'Внедрите систему контроля качества'
        ],
        medium: [
          'Обучите команду сервисным стандартам',
          'Внедрите систему обратной связи от гостей',
          'Мотивируйте персонал на качество'
        ],
        good: [
          'Создайте wow-эффекты для гостей',
          'Внедрите программу лояльности',
          'Развивайте культуру гостеприимства'
        ]
      },
      management: {
        critical: [
          'Настройте учёт доходов и расходов',
          'Рассчитайте точку безубыточности',
          'Внедрите базовую CRM'
        ],
        medium: [
          'Автоматизируйте процессы бронирования',
          'Настройте аналитику по источникам',
          'Внедрите KPI для команды'
        ],
        good: [
          'Оптимизируйте все бизнес-процессы',
          'Внедрите предиктивную аналитику',
          'Масштабируйте успешную модель'
        ]
      }
    };

    return recommendations[blockId]?.[level] || [];
  };

  return (
    <Card className="border-none shadow-2xl mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="List" size={24} />
          Детальные рекомендации по блокам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {blockScores.map((block) => {
            const recommendations = getRecommendations(block.id, block.level);
            
            return (
              <div key={block.id} className="border-l-4 border-l-indigo-500 pl-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon name={block.icon as any} size={20} />
                    <h3 className="font-semibold text-lg">{block.title}</h3>
                  </div>
                  <Badge className={
                    block.level === 'critical' ? 'bg-red-100 text-red-800' :
                    block.level === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {Math.round(block.percentage)}%
                  </Badge>
                </div>
                
                <ul className="space-y-2">
                  {recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-700">
                      <Icon name="CheckCircle2" size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
