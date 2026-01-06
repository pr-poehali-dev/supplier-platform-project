import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const BlogSection = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogCategories = ['all', 'Советы отельерам', 'Тренды туризма', 'Бизнес-туризм'];
  
  const blogPosts = [
    {
      id: 1,
      title: 'Как повысить конверсию отеля в 2026 году',
      category: 'Советы отельерам',
      date: '15 декабря 2025',
      excerpt: 'Разбираем топ-5 стратегий для увеличения бронирований и лояльности гостей в новом сезоне.',
      image: 'https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/ac90d11c-a95e-46ee-a6cc-92186aa4c753.jpg',
    },
    {
      id: 2,
      title: 'Тренды делового туризма: что меняется',
      category: 'Бизнес-туризм',
      date: '10 декабря 2025',
      excerpt: 'Гибридные мероприятия, устойчивый туризм и новые технологии определяют будущее MICE-индустрии.',
      image: 'https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/e0352ee6-00e4-480a-8fca-7da4fd51358d.jpg',
    },
    {
      id: 3,
      title: 'Цифровизация туристической отрасли',
      category: 'Тренды туризма',
      date: '5 декабря 2025',
      excerpt: 'Как технологии меняют способ взаимодействия между поставщиками и клиентами в туризме.',
      image: 'https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/d8dbc1da-916a-40f4-bf88-eb6eddb1fdf7.jpg',
    },
    {
      id: 4,
      title: 'Персонализация сервиса: новый стандарт',
      category: 'Советы отельерам',
      date: '1 декабря 2025',
      excerpt: 'Почему индивидуальный подход к каждому гостю становится критически важным конкурентным преимуществом.',
      image: 'https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/ac90d11c-a95e-46ee-a6cc-92186aa4c753.jpg',
    },
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <section id="blog" className="py-20 px-4 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
            📚 Знания и инсайты
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-4">
            Блог экспертов
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Актуальные тренды, практические советы и кейсы из мира туризма
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {blogCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? 'bg-gradient-to-r from-primary to-secondary' : ''}
            >
              {category === 'all' ? 'Все статьи' : category}
            </Button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post, index) => (
            <Card 
              key={post.id} 
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-none"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-primary border-none">
                    {post.category}
                  </Badge>
                </div>
              </div>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500 mb-2">{post.date}</p>
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
      </div>
    </section>
  );
};

export default BlogSection;
