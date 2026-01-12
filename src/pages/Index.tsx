import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import HeroSection from '@/components/sections/HeroSection';
import BlogSection from '@/components/sections/BlogSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import AboutSection from '@/components/sections/AboutSection';
import ContactSection from '@/components/sections/ContactSection';
import { usePageMeta } from '@/hooks/usePageMeta';

const Index = () => {
  usePageMeta({
    title: 'Главная',
    description: 'TOURCONNECT — комплексная платформа для развития туристического бизнеса. Симулятор бизнеса, календарь бронирований, диагностика проектов и инструменты управления.',
    keywords: 'турбизнес, туризм России, календарь бронирований, глэмпинг, турбаза, гостиница, симулятор бизнеса'
  });
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            TourConnect
          </h1>
          <div className="hidden md:flex gap-6 items-center">
            <button
              onClick={() => scrollToSection('home')}
              className={`font-medium transition-colors hover:text-primary ${
                activeSection === 'home' ? 'text-primary' : 'text-gray-600'
              }`}
            >
              Главная
            </button>
            
            <div className="relative group">
              <button className="font-medium text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
                Инструменты
                <Icon name="ChevronDown" size={16} />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  <a href="/booking-calendar" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <Icon name="Calendar" size={18} className="text-primary" />
                    <div>
                      <div className="font-medium text-gray-900">Календарь</div>
                      <div className="text-xs text-gray-500">Управление бронью</div>
                    </div>
                  </a>
                  <a href="/diagnostics" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <Icon name="Activity" size={18} className="text-secondary" />
                    <div>
                      <div className="font-medium text-gray-900">Диагностика</div>
                      <div className="text-xs text-gray-500">Анализ бизнеса</div>
                    </div>
                  </a>
                  <a href="/simulator" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <Icon name="TrendingUp" size={18} className="text-accent" />
                    <div>
                      <div className="font-medium text-gray-900">Симулятор</div>
                      <div className="text-xs text-gray-500">Расчёт прибыли</div>
                    </div>
                  </a>
                  <a href="/club" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <Icon name="Users" size={18} className="text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Клуб</div>
                      <div className="text-xs text-gray-500">Нетворкинг</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/pricing')}
              className="font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Цены
            </button>
            <button
              onClick={() => scrollToSection('blog')}
              className={`font-medium transition-colors hover:text-primary ${
                activeSection === 'blog' ? 'text-primary' : 'text-gray-600'
              }`}
            >
              Блог
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className={`font-medium transition-colors hover:text-primary ${
                activeSection === 'about' ? 'text-primary' : 'text-gray-600'
              }`}
            >
              О нас
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className={`font-medium transition-colors hover:text-primary ${
                activeSection === 'contact' ? 'text-primary' : 'text-gray-600'
              }`}
            >
              Контакты
            </button>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {user.avatar_url && (
                  <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full" />
                )}
                <span className="font-medium text-gray-700">{user.full_name || user.email}</span>
              </button>
              {user.is_admin && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  <Icon name="Shield" className="mr-2" size={16} />
                  Админ
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('user');
                  setUser(null);
                  navigate('/');
                }}
                className="border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                <Icon name="LogOut" className="mr-2" size={16} />
                Выйти
              </Button>
            </div>
          ) : (
            <Button 
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              onClick={() => navigate('/auth')}
            >
              Войти
            </Button>
          )}
        </div>
      </nav>

      <HeroSection scrollToSection={scrollToSection} />
      <BlogSection />
      <AboutSection />
      <ContactSection />

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold font-heading mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                TourConnect
              </h3>
              <p className="text-gray-400 text-sm">
                Инструменты и комьюнити для бизнеса в туризме России
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">О нас</button></li>
                <li><button onClick={() => scrollToSection('blog')} className="hover:text-white transition-colors">Блог</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Контакты</button></li>
                <li><a href="/oferta" className="hover:text-white transition-colors">Публичная оферта</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Продукты</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/diagnostics" className="hover:text-white transition-colors">Диагностика бизнеса</a></li>
                <li><a href="/profile" className="hover:text-white transition-colors">Личный кабинет</a></li>
                <li><a href="/simulator" className="hover:text-white transition-colors">Симулятор бизнеса</a></li>
                <li><a href="/club" className="hover:text-white transition-colors">Клуб партнёров</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Социальные сети</h4>
              <div className="flex gap-4">
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Icon name="Facebook" size={20} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Icon name="Twitter" size={20} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Icon name="Instagram" size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 TourConnect. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;