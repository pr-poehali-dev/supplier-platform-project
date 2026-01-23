import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import UserProfile from './UserProfile';

interface MainNavProps {
  activeSection: string;
  user: any;
  onScrollToSection: (section: string) => void;
  onNavigate: (path: string) => void;
}

export default function MainNav({ activeSection, user, onScrollToSection, onNavigate }: MainNavProps) {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          TourConnect
        </h1>
        <div className="hidden md:flex gap-6 items-center">
          <button
            onClick={() => onScrollToSection('home')}
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
                <button onClick={() => onNavigate('/simulator')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3">
                  <Icon name="Calculator" size={18} className="text-primary" />
                  Симулятор экономики
                </button>
                <button onClick={() => onNavigate('/diagnostics')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3">
                  <Icon name="Activity" size={18} className="text-secondary" />
                  Диагностика проекта
                </button>
                <button onClick={() => onNavigate('/booking-calendar')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3">
                  <Icon name="Calendar" size={18} className="text-accent" />
                  Календарь броней
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => onScrollToSection('features')}
            className={`font-medium transition-colors hover:text-primary ${
              activeSection === 'features' ? 'text-primary' : 'text-gray-600'
            }`}
          >
            Возможности
          </button>
          <button
            onClick={() => onScrollToSection('about')}
            className={`font-medium transition-colors hover:text-primary ${
              activeSection === 'about' ? 'text-primary' : 'text-gray-600'
            }`}
          >
            О платформе
          </button>
          <button
            onClick={() => onNavigate('/roadmap')}
            className="font-medium text-gray-600 hover:text-primary transition-colors"
          >
            Roadmap
          </button>
          <button
            onClick={() => onScrollToSection('contact')}
            className={`font-medium transition-colors hover:text-primary ${
              activeSection === 'contact' ? 'text-primary' : 'text-gray-600'
            }`}
          >
            Контакты
          </button>
        </div>
        <div className="flex gap-2">
          <UserProfile user={user} />
        </div>
      </div>
    </nav>
  );
}