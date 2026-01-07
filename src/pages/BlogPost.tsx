import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: number;
  title: string;
  category: string;
  published_at: string;
  excerpt: string;
  content: string;
  image_url: string;
  video_url?: string;
  media_type?: 'image' | 'video' | 'none';
}

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const categoryMap: Record<string, string> = {
    'новость': 'Новости',
    'статья': 'Статьи',
    'блог': 'Блог',
    'тренды': 'Тренды туризма',
    'интервью': 'Интервью'
  };

  useEffect(() => {
    fetchPost();
    checkAdminStatus();
  }, [id]);

  const checkAdminStatus = () => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsAdmin(userData.is_admin || false);
      } catch (e) {
        setIsAdmin(false);
      }
    }
  };

  const deletePost = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту статью?')) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://functions.poehali.dev/57e87325-acea-4f23-9b9b-048fa498ae14?post_id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Статья удалена'
        });
        navigate('/');
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить статью',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://functions.poehali.dev/0e09f71c-79fb-4a6c-ad91-6ca81f12a263?limit=100&channel_type=free`);
      const data = await response.json();
      
      if (data.posts) {
        const currentPost = data.posts.find((p: BlogPost) => p.id === parseInt(id || '0'));
        setPost(currentPost || null);
        
        if (currentPost) {
          const related = data.posts
            .filter((p: BlogPost) => p.id !== currentPost.id && p.category === currentPost.category)
            .slice(0, 3);
          setRelatedPosts(related);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки статьи:', error);
    } finally {
      setLoading(false);
    }
  };

  const sharePost = (platform: string) => {
    const url = window.location.href;
    const text = post?.title || '';
    
    const shareUrls: Record<string, string> = {
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      vk: `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      copy: url
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Ссылка скопирована в буфер обмена!');
    } else {
      window.open(shareUrls[platform], '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto text-primary" size={48} />
          <p className="mt-4 text-gray-600">Загрузка статьи...</p>
        </div>
      </div>
    );
  }

  if (!post) {
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
          </div>
        </nav>
        <div className="container mx-auto px-4 py-20 text-center">
          <Icon name="FileX" className="mx-auto text-gray-400 mb-4" size={64} />
          <h1 className="text-3xl font-bold mb-4">Статья не найдена</h1>
          <p className="text-gray-600 mb-8">К сожалению, запрашиваемая статья не существует или была удалена</p>
          <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-primary to-secondary">
            <Icon name="Home" className="mr-2" size={20} />
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

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
          <div className="flex gap-3">
            {isAdmin && (
              <Button 
                onClick={deletePost} 
                disabled={deleting}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Icon name="Trash2" size={18} />
                {deleting ? 'Удаление...' : 'Удалить'}
              </Button>
            )}
            <Button onClick={() => navigate('/club')} className="bg-gradient-to-r from-primary to-secondary">
              Клуб партнёров
            </Button>
          </div>
        </div>
      </nav>

      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
              {categoryMap[post.category] || post.category}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold font-heading mb-6 animate-fade-in">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size={18} />
                <span>
                  {new Date(post.published_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {post.media_type === 'video' && post.video_url ? (
              <video
                src={post.video_url}
                controls
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl mb-8"
                poster={post.image_url || ''}
              >
                <source src={post.video_url} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
            ) : post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl mb-8"
              />
            ) : null}
          </div>

          <Card className="border-none shadow-xl mb-8">
            <CardContent className="pt-8">
              <div className="prose prose-lg max-w-none">
                {post.content.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-purple-50 mb-12">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Icon name="Share2" className="text-primary" size={24} />
                  <span className="font-semibold text-lg">Поделиться статьей:</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => sharePost('telegram')}
                    className="bg-[#0088cc] hover:bg-[#006699] text-white"
                    size="lg"
                  >
                    <Icon name="Send" size={20} />
                  </Button>
                  <Button
                    onClick={() => sharePost('whatsapp')}
                    className="bg-[#25D366] hover:bg-[#1da851] text-white"
                    size="lg"
                  >
                    <Icon name="MessageCircle" size={20} />
                  </Button>
                  <Button
                    onClick={() => sharePost('vk')}
                    className="bg-[#0077FF] hover:bg-[#0066dd] text-white"
                    size="lg"
                  >
                    <span className="font-bold">VK</span>
                  </Button>
                  <Button
                    onClick={() => sharePost('copy')}
                    variant="outline"
                    size="lg"
                  >
                    <Icon name="Copy" size={20} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold font-heading mb-8">Похожие статьи</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-none cursor-pointer"
                    onClick={() => navigate(`/blog/${relatedPost.id}`)}
                  >
                    <div className="relative overflow-hidden">
                      {relatedPost.image_url && (
                        <img
                          src={relatedPost.image_url}
                          alt={relatedPost.title}
                          className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-primary border-none">
                          {categoryMap[relatedPost.category] || relatedPost.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="text-lg font-bold font-heading mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{relatedPost.excerpt}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
};

export default BlogPost;