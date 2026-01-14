import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface BlogPost {
  id: number;
  title: string;
  category: string;
  published_at: string;
  excerpt: string;
  image_url: string;
}

const BlogSection = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryMap: Record<string, string> = {
    'новость': 'Новости',
    'статья': 'Статьи',
    'блог': 'Блог',
    'тренды': 'Тренды туризма',
    'интервью': 'Интервью'
  };

  useEffect(() => {
    fetchBlogPosts();
  }, [selectedCategory]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const category = selectedCategory === 'all' ? '' : selectedCategory;
      const url = `https://functions.poehali.dev/88f9e6df-cb97-4ca2-a475-012b4633202c?limit=20&channel_type=free${category ? `&category=${category}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.posts) {
        setBlogPosts(data.posts);
      }
    } catch (error) {
      // Error loading posts
    } finally {
      setLoading(false);
    }
  };

  const blogCategories = ['all', ...Object.keys(categoryMap)];
  const filteredPosts = blogPosts;

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
              {category === 'all' ? 'Все статьи' : categoryMap[category] || category}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Icon name="Loader2" className="animate-spin mx-auto text-primary" size={48} />
            <p className="mt-4 text-gray-600">Загрузка статей...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="FileText" className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">Пока нет опубликованных статей</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
            <Card 
              key={post.id} 
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-none cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(`/blog/${post.id}`)}
            >
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
      </div>
    </section>
  );
};

export default BlogSection;