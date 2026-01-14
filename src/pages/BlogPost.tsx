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
      
      // Загружаем конкретный пост с полным content
      const postResponse = await fetch(`https://functions.poehali.dev/88f9e6df-cb97-4ca2-a475-012b4633202c?id=${id}`);
      const postData = await postResponse.json();
      
      if (postData.post) {
        setPost(postData.post);
        
        // Загружаем похожие статьи
        const listResponse = await fetch(`https://functions.poehali.dev/88f9e6df-cb97-4ca2-a475-012b4633202c?limit=100&channel_type=free`);
        const listData = await listResponse.json();
        
        if (listData.posts) {
          const related = listData.posts
            .filter((p: BlogPost) => p.id !== postData.post.id && p.category === postData.post.category)
            .slice(0, 3);
          setRelatedPosts(related);
        }
      }
    } catch (error) {
      // Error loading post
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
    <div className="min-h-screen bg-white">
      <nav className="border-b sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
              <span className="font-medium">Назад</span>
            </button>
            {isAdmin && (
              <Button 
                onClick={deletePost} 
                disabled={deleting}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Icon name="Trash2" size={16} className="mr-2" />
                {deleting ? 'Удаление...' : 'Удалить'}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <article className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                {categoryMap[post.category] || post.category}
              </Badge>
              <span className="text-sm text-gray-500">
                {new Date(post.published_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
              {post.title}
            </h1>

            {post.media_type === 'video' && post.video_url ? (
              <video
                src={post.video_url}
                controls
                className="w-full aspect-video rounded-lg mb-12"
                poster={post.image_url || ''}
              >
                <source src={post.video_url} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
            ) : post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full aspect-video object-cover rounded-lg mb-12"
              />
            ) : null}
          </div>

          <div className="prose prose-lg max-w-none mb-12">
            {post.content?.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="mb-6 text-gray-800 leading-relaxed text-lg">
                  {paragraph}
                </p>
              )
            ))}
          </div>

          <div className="border-t pt-8 mb-12">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Поделиться статьей</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => sharePost('telegram')}
                  variant="outline"
                  size="sm"
                  className="text-[#0088cc] border-[#0088cc] hover:bg-[#0088cc] hover:text-white"
                >
                  <Icon name="Send" size={16} />
                </Button>
                <Button
                  onClick={() => sharePost('whatsapp')}
                  variant="outline"
                  size="sm"
                  className="text-[#25D366] border-[#25D366] hover:bg-[#25D366] hover:text-white"
                >
                  <Icon name="MessageCircle" size={16} />
                </Button>
                <Button
                  onClick={() => sharePost('vk')}
                  variant="outline"
                  size="sm"
                  className="text-[#0077FF] border-[#0077FF] hover:bg-[#0077FF] hover:text-white"
                >
                  <span className="text-xs font-bold">VK</span>
                </Button>
                <Button
                  onClick={() => sharePost('copy')}
                  variant="outline"
                  size="sm"
                >
                  <Icon name="Copy" size={16} />
                </Button>
              </div>
            </div>
          </div>

          {relatedPosts.length > 0 && (
            <section className="border-t pt-12">
              <h2 className="text-2xl font-bold mb-8">Читайте также</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/blog/${relatedPost.id}`)}
                  >
                    {relatedPost.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={relatedPost.image_url}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {categoryMap[relatedPost.category] || relatedPost.category}
                      </Badge>
                      <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
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