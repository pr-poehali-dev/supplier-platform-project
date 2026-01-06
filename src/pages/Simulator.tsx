import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlogPost {
  id: number;
  title: string;
  category: string;
  published_at: string;
  excerpt: string;
  image_url: string;
}

const Simulator = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);
  
  const [format, setFormat] = useState<'weekend' | 'eco' | 'glamping'>('weekend');
  const [units, setUnits] = useState(15);
  const [price, setPrice] = useState(8000);
  const [occupancy, setOccupancy] = useState(65);
  const [season, setSeason] = useState<'low' | 'medium' | 'high'>('medium');
  const [staffExpenses, setStaffExpenses] = useState(400000);
  const [marketingExpenses, setMarketingExpenses] = useState(0);
  const [otherExpenses, setOtherExpenses] = useState(0);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);

  const categoryMap: Record<string, string> = {
    'новость': 'Новости',
    'статья': 'Статьи',
    'блог': 'Блог',
    'тренды': 'Тренды туризма',
    'интервью': 'Интервью'
  };

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoadingBlog(true);
      const response = await fetch('https://functions.poehali.dev/0e09f71c-79fb-4a6c-ad91-6ca81f12a263?limit=3&channel_type=free');
      const data = await response.json();
      
      if (data.posts) {
        setBlogPosts(data.posts);
      }
    } catch (error) {
      console.error('Ошибка загрузки постов:', error);
    } finally {
      setLoadingBlog(false);
    }
  };

  const seasonCoeff = { low: 0.6, medium: 1.0, high: 1.3 };

  const monthlyRevenue = units * price * (occupancy / 100) * 30 * seasonCoeff[season];
  const utilities = units * 15000;
  const marketing = marketingExpenses || (monthlyRevenue * 0.05);
  const totalExpenses = staffExpenses + utilities + marketing + otherExpenses;
  const result = monthlyRevenue - totalExpenses;

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getResultInterpretation = () => {
    if (result < 0) {
      return {
        title: 'Экономика не сходится при текущих параметрах',
        description: 'Типичная ситуация для старта без подушки. Необходимо пересмотреть цену, загрузку или расходы.',
        color: 'text-red-600',
        bg: 'bg-red-50',
        icon: 'AlertCircle'
      };
    } else if (result < 100000) {
      return {
        title: 'Проект балансирует на грани',
        description: 'Высокий риск кассовых разрывов. Малейшие отклонения могут привести к убыткам.',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        icon: 'AlertTriangle'
      };
    } else {
      return {
        title: 'Модель выглядит жизнеспособной',
        description: 'Критично проверить сезонность и загрузку на практике. Запланируйте резерв на непредвиденные расходы.',
        color: 'text-green-600',
        bg: 'bg-green-50',
        icon: 'CheckCircle2'
      };
    }
  };

  const getExpertComments = () => {
    const comments = [];
    
    if (occupancy < 40) {
      comments.push({
        icon: 'TrendingDown',
        text: 'Низкая загрузка говорит об иллюзии спроса. Проверьте реальность ваших ожиданий по заполняемости.'
      });
    }
    
    if (price > 12000) {
      comments.push({
        icon: 'Sparkles',
        text: 'Высокая цена требует соответствующего сервиса и позиционирования. Гости будут ожидать премиум-уровень.'
      });
    }
    
    if (units > 20 && staffExpenses < 300000) {
      comments.push({
        icon: 'Users',
        text: 'Много номеров при небольших затратах на персонал — риск сервисного провала. Гости заметят недостаток внимания.'
      });
    }
    
    if (season === 'high' && monthlyRevenue > 3000000) {
      comments.push({
        icon: 'Calendar',
        text: 'Высокая зависимость от пикового сезона. В низкий сезон экономика может не выдержать этих расходов.'
      });
    }

    if (occupancy > 80) {
      comments.push({
        icon: 'Target',
        text: 'Загрузка выше 80% в среднем — амбициозный показатель. Учитывайте время на уборку и обслуживание.'
      });
    }

    if (result > 0 && result < 200000) {
      comments.push({
        icon: 'PiggyBank',
        text: 'Небольшая маржа не даст запаса на развитие. Планируйте улучшение экономики через рост загрузки или снижение издержек.'
      });
    }

    return comments;
  };

  const interpretation = getResultInterpretation();
  const expertComments = getExpertComments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <Icon name="ArrowLeft" className="group-hover:-translate-x-1 transition-transform" size={20} />
            <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TourConnect
            </h1>
          </button>
          <Button onClick={() => navigate('/club')} className="bg-gradient-to-r from-primary to-secondary">
            Клуб партнёров
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              📊 Инструмент мышления
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold font-heading mb-3">
              Симулятор экономики базы отдыха
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Инструмент для понимания модели. Не является бизнес-планом.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Settings" className="text-primary" size={24} />
                  Параметры проекта
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Формат проекта</Label>
                  <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekend">База выходного дня</SelectItem>
                      <SelectItem value="eco">Эко-отель</SelectItem>
                      <SelectItem value="glamping">Глэмпинг</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Количество домиков / номеров</Label>
                  <input
                    type="number"
                    value={units}
                    onChange={(e) => setUnits(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                    max="50"
                  />
                  <p className="text-sm text-gray-500">От 1 до 50</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Средняя цена за ночь (₽)</Label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Math.max(1000, parseInt(e.target.value) || 1000))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1000"
                    step="500"
                  />
                  <p className="text-sm text-gray-500">{formatMoney(price)}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Средняя загрузка (%)</Label>
                  <input
                    type="number"
                    value={occupancy}
                    onChange={(e) => setOccupancy(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    max="100"
                  />
                  <p className="text-sm text-gray-500">От 0 до 100%</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Сезонность</Label>
                  <Select value={season} onValueChange={(v: any) => setSeason(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий сезон (×0.6)</SelectItem>
                      <SelectItem value="medium">Средний сезон (×1.0)</SelectItem>
                      <SelectItem value="high">Высокий сезон (×1.3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-px bg-gray-200 my-4"></div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Расходы на персонал (₽/мес)</Label>
                  <input
                    type="number"
                    value={staffExpenses}
                    onChange={(e) => setStaffExpenses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    step="10000"
                  />
                  <p className="text-sm text-gray-500">{formatMoney(staffExpenses)}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Расходы на маркетинг (₽/мес)</Label>
                  <input
                    type="number"
                    value={marketingExpenses}
                    onChange={(e) => setMarketingExpenses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    step="5000"
                    placeholder="По умолчанию 5% от дохода"
                  />
                  <p className="text-sm text-gray-500">
                    {marketingExpenses > 0 ? formatMoney(marketingExpenses) : '5% от дохода (по умолчанию)'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Прочие расходы (₽/мес)</Label>
                  <input
                    type="number"
                    value={otherExpenses}
                    onChange={(e) => setOtherExpenses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    step="5000"
                  />
                  <p className="text-sm text-gray-500">{formatMoney(otherExpenses)}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Calculator" className="text-primary" size={24} />
                    Расчёт за месяц
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Доход</span>
                    <span className="text-xl font-bold text-green-600">{formatMoney(monthlyRevenue)}</span>
                  </div>
                  
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Персонал</span>
                      <span className="font-medium">{formatMoney(staffExpenses)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Коммунальные и обслуживание</span>
                      <span className="font-medium">{formatMoney(utilities)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Маркетинг</span>
                      <span className="font-medium">{formatMoney(marketing)}</span>
                    </div>
                    {otherExpenses > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Прочие расходы</span>
                        <span className="font-medium">{formatMoney(otherExpenses)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="text-gray-700 font-medium">Расходы</span>
                      <span className="text-lg font-bold text-red-600">{formatMoney(totalExpenses)}</span>
                    </div>
                  </div>

                  <div className={`flex justify-between items-center p-4 ${interpretation.bg} rounded-lg border-2 ${result >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                    <span className="text-gray-700 font-semibold text-lg">Валовый результат</span>
                    <span className={`text-2xl font-bold ${interpretation.color}`}>
                      {formatMoney(result)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-none shadow-xl ${interpretation.bg}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Icon name={interpretation.icon as any} className={interpretation.color} size={28} />
                    <div>
                      <h3 className={`font-bold text-lg ${interpretation.color} mb-1`}>
                        {interpretation.title}
                      </h3>
                      <p className="text-gray-700">
                        {interpretation.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {expertComments.length > 0 && (
            <Card className="border-none shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Lightbulb" className="text-amber-500" size={24} />
                  Экспертные комментарии
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expertComments.map((comment, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <Icon name={comment.icon as any} className="text-amber-600 flex-shrink-0 mt-1" size={20} />
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-xl bg-gray-50 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Icon name="Info" className="text-gray-500 flex-shrink-0 mt-1" size={20} />
                <p className="text-sm text-gray-600 leading-relaxed">
                  <strong>Дисклеймер:</strong> Все расчёты являются ориентировочными и служат для понимания модели. 
                  Симулятор не является бизнес-планом и не учитывает индивидуальные условия проекта.
                </p>
              </div>
            </CardContent>
          </Card>

          <section className="py-12">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
                📚 Знания и инсайты
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold font-heading mb-4">
                Блог экспертов
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Актуальные тренды, практические советы и кейсы из мира туризма
              </p>
            </div>

            {loadingBlog ? (
              <div className="text-center py-12">
                <Icon name="Loader2" className="animate-spin mx-auto text-primary" size={48} />
                <p className="mt-4 text-gray-600">Загрузка статей...</p>
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="FileText" className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Пока нет опубликованных статей</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-none cursor-pointer"
                  onClick={() => navigate(`/blog/${post.id}`)}
                >
                  <div className="relative overflow-hidden">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-primary border-none">
                        {categoryMap[post.category] || post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(post.published_at).toLocaleDateString('ru-RU', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <h3 className="text-xl font-bold font-heading mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <Button variant="ghost" className="group/btn p-0 h-auto font-semibold text-primary">
                      Читать далее
                      <Icon name="ArrowRight" className="ml-2 group-hover/btn:translate-x-1 transition-transform" size={16} />
                    </Button>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Simulator;