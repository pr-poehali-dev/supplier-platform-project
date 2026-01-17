import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '@/lib/api';
import SimulatorInputs from '@/components/simulator/SimulatorInputs';
import SimulatorResults from '@/components/simulator/SimulatorResults';
import ExpertComments from '@/components/simulator/ExpertComments';

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
    const userStr = localStorage.getItem('user');
    if (!userStr) {
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
      const response = await fetchWithAuth('https://functions.poehali.dev/88f9e6df-cb97-4ca2-a475-012b4633202c?limit=3&channel_type=free');
      const data = await response.json();
      
      if (data.posts) {
        setBlogPosts(data.posts);
      }
    } catch (error) {
      // Error loading posts
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
            <SimulatorInputs
              format={format}
              setFormat={setFormat}
              units={units}
              setUnits={setUnits}
              price={price}
              setPrice={setPrice}
              occupancy={occupancy}
              setOccupancy={setOccupancy}
              season={season}
              setSeason={setSeason}
              staffExpenses={staffExpenses}
              setStaffExpenses={setStaffExpenses}
              marketingExpenses={marketingExpenses}
              setMarketingExpenses={setMarketingExpenses}
              otherExpenses={otherExpenses}
              setOtherExpenses={setOtherExpenses}
            />

            <SimulatorResults
              monthlyRevenue={monthlyRevenue}
              staffExpenses={staffExpenses}
              utilities={utilities}
              marketing={marketing}
              otherExpenses={otherExpenses}
              totalExpenses={totalExpenses}
              result={result}
              interpretation={interpretation}
            />
          </div>

          <ExpertComments comments={expertComments} />

          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-heading">Полезные материалы</h2>
              <Button variant="outline" onClick={() => navigate('/club')}>
                Все материалы
              </Button>
            </div>

            {loadingBlog ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-none shadow-lg animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="pt-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {blogPosts.map((post) => (
                  <Card key={post.id} className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                    <div className="relative overflow-hidden rounded-t-lg h-48">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800">
                        {categoryMap[post.category] || post.category}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(post.published_at).toLocaleDateString('ru-RU')}
                        </span>
                        <Icon name="ArrowRight" size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
