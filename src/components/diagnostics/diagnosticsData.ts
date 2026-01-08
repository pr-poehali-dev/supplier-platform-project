export interface Question {
  id: string;
  text: string;
  options: Array<{ value: number; label: string; icon: string }>;
}

export interface Block {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: Question[];
}

export const diagnosticsBlocks: Block[] = [
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
