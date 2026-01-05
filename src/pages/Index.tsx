import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const blogCategories = ['all', 'Советы отельерам', 'Тренды туризма', 'Бизнес-туризм'];
  
  const blogPosts = [
    {
      id: 1,
      title: 'Как повысить конверсию отеля в 2026 году',
      category: 'Советы отельерам',
      date: '15 декабря 2025',
      excerpt: 'Разбираем топ-5 стратегий для увеличения бронирований и лояльности гостей в новом сезоне.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    },
    {
      id: 2,
      title: 'Тренды делового туризма: что меняется',
      category: 'Бизнес-туризм',
      date: '10 декабря 2025',
      excerpt: 'Гибридные мероприятия, устойчивый туризм и новые технологии определяют будущее MICE-индустрии.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    },
    {
      id: 3,
      title: 'Цифровизация туристической отрасли',
      category: 'Тренды туризма',
      date: '5 декабря 2025',
      excerpt: 'Как технологии меняют способ взаимодействия между поставщиками и клиентами в туризме.',
      image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop',
    },
    {
      id: 4,
      title: 'Персонализация сервиса: новый стандарт',
      category: 'Советы отельерам',
      date: '1 декабря 2025',
      excerpt: 'Почему индивидуальный подход к каждому гостю становится критически важным конкурентным преимуществом.',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
    },
  ];

  const teamMembers = [
    {
      name: 'Анна Петрова',
      role: 'CEO & Основатель',
      description: '15+ лет в туристической индустрии',
    },
    {
      name: 'Дмитрий Соколов',
      role: 'CTO',
      description: 'Эксперт по цифровым решениям',
    },
    {
      name: 'Елена Морозова',
      role: 'Head of Partnerships',
      description: 'Связующее звено экосистемы',
    },
  ];

  const advantages = [
    {
      icon: 'Users',
      title: 'Проверенная сеть',
      description: '500+ надежных партнеров со всего мира',
      gradient: 'from-primary to-secondary',
    },
    {
      icon: 'Zap',
      title: 'Автоматизация',
      description: 'Технологии, которые экономят время и ресурсы',
      gradient: 'from-secondary to-accent',
    },
    {
      icon: 'TrendingUp',
      title: 'Рост бизнеса',
      description: 'Инструменты для масштабирования вашей компании',
      gradient: 'from-accent to-primary',
    },
    {
      icon: 'Shield',
      title: 'Надежность',
      description: 'Защита данных и прозрачные условия сотрудничества',
      gradient: 'from-primary/80 to-secondary/80',
    },
  ];

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Заявка отправлена!',
      description: 'Мы свяжемся с вами в ближайшее время.',
    });
  };

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            TourConnect
          </h1>
          <div className="hidden md:flex gap-6">
            {['home', 'blog', 'about', 'contact'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`font-medium transition-colors hover:text-primary ${
                  activeSection === section ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {section === 'home' && 'Главная'}
                {section === 'blog' && 'Блог'}
                {section === 'about' && 'О нас'}
                {section === 'contact' && 'Контакты'}
              </button>
            ))}
          </div>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            Войти
          </Button>
        </div>
      </nav>

      <section id="home" className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                🚀 Платформа нового поколения
              </Badge>
              <h2 className="text-5xl lg:text-6xl font-bold font-heading leading-tight">
                Платформа для{' '}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  профессионалов
                </span>{' '}
                туризма
              </h2>
              <p className="text-xl text-gray-600">
                Находим партнёров, автоматизируем процессы, растём вместе. Присоединяйтесь к экосистеме, где каждый находит своё место.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg"
                  onClick={() => scrollToSection('contact')}
                >
                  Стать поставщиком
                  <Icon name="ArrowRight" className="ml-2" size={20} />
                </Button>
                <Button size="lg" variant="outline" className="text-lg">
                  Узнать больше
                </Button>
              </div>
            </div>
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              <img
                src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop"
                alt="Tourism platform"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {advantages.map((advantage, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-none overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-2 bg-gradient-to-r ${advantage.gradient}`}></div>
                <CardContent className="pt-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${advantage.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon name={advantage.icon as any} className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-2">{advantage.title}</h3>
                  <p className="text-gray-600">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

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

      <section id="about" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="animate-fade-in">
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                🎯 Наша миссия
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-6">
                О проекте TourConnect
              </h2>
              <div className="space-y-4 text-lg text-gray-600">
                <p>
                  Мы создали платформу, которая объединяет профессионалов туристической индустрии по всему миру. 
                  Наша цель — сделать взаимодействие между поставщиками услуг простым, прозрачным и эффективным.
                </p>
                <p>
                  С 2020 года мы помогаем отелям, турагентствам, организаторам мероприятий и другим участникам 
                  рынка находить надежных партнеров и масштабировать свой бизнес.
                </p>
                <p className="font-semibold text-primary">
                  Наши ценности: доверие, инновации, партнерство и профессионализм.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-3xl blur-3xl"></div>
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop"
                alt="Team collaboration"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>

          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold font-heading mb-4">Наша команда</h3>
            <p className="text-gray-600 text-lg">Профессионалы, которые делают проект реальностью</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card 
                key={index} 
                className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-none"
              >
                <CardContent className="pt-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-accent mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <h4 className="text-xl font-bold font-heading mb-2">{member.name}</h4>
                  <p className="text-primary font-semibold mb-2">{member.role}</p>
                  <p className="text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              💼 Начните сотрудничество
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-4">
              Свяжитесь с нами
            </h2>
            <p className="text-xl text-gray-600">
              Заполните форму, и мы обсудим возможности сотрудничества
            </p>
          </div>

          <Card className="border-none shadow-2xl">
            <CardContent className="pt-8">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Ваше имя</label>
                    <Input placeholder="Иван Иванов" required className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Email</label>
                    <Input type="email" placeholder="ivan@example.com" required className="h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Компания</label>
                  <Input placeholder="Название вашей компании" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Ваш запрос</label>
                  <Textarea 
                    placeholder="Расскажите, чем мы можем помочь..." 
                    required 
                    className="min-h-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="privacy" required className="w-4 h-4" />
                  <label htmlFor="privacy" className="text-sm text-gray-600">
                    Согласен на обработку персональных данных
                  </label>
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg"
                >
                  Отправить заявку
                  <Icon name="Send" className="ml-2" size={20} />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center border-none">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon name="Mail" className="text-primary" size={24} />
                </div>
                <p className="font-semibold mb-1">Email</p>
                <p className="text-gray-600">info@tourconnect.ru</p>
              </CardContent>
            </Card>
            <Card className="text-center border-none">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon name="Phone" className="text-secondary" size={24} />
                </div>
                <p className="font-semibold mb-1">Телефон</p>
                <p className="text-gray-600">+7 (495) 123-45-67</p>
              </CardContent>
            </Card>
            <Card className="text-center border-none">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Icon name="MapPin" className="text-accent" size={24} />
                </div>
                <p className="font-semibold mb-1">Адрес</p>
                <p className="text-gray-600">Москва, ул. Примерная, 1</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold font-heading mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                TourConnect
              </h3>
              <p className="text-gray-400">
                Платформа для профессионалов туризма
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Навигация</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">Главная</button></li>
                <li><button onClick={() => scrollToSection('blog')} className="hover:text-white transition-colors">Блог</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">О нас</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Контакты</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Юридическая информация</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Условия использования</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Публичная оферта</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Соцсети</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Icon name="Facebook" size={20} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Icon name="Twitter" size={20} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Icon name="Linkedin" size={20} />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 TourConnect. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
