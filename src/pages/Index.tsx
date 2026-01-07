import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import HeroSection from '@/components/sections/HeroSection';
import BlogSection from '@/components/sections/BlogSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import AboutSection from '@/components/sections/AboutSection';
import ContactSection from '@/components/sections/ContactSection';

const Index = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');

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
          <Button 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            onClick={() => navigate('/auth')}
          >
            Войти
          </Button>
        </div>
      </nav>

      <HeroSection scrollToSection={scrollToSection} />
      <BlogSection />
      <FeaturesSection />
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
                База знаний и комьюнити для бизнеса в туризме России
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">О нас</button></li>
                <li><button onClick={() => scrollToSection('blog')} className="hover:text-white transition-colors">Блог</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Контакты</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Продукты</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/diagnostics" className="hover:text-white transition-colors">Диагностика бизнеса</a></li>
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