import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

interface DiagnosticsNavBarProps {
  answeredQuestions: number;
  totalQuestions: number;
  progress: number;
}

const DiagnosticsNavBar = ({ answeredQuestions, totalQuestions, progress }: DiagnosticsNavBarProps) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TourConnect
            </h1>
          </button>
          <div className="text-sm text-gray-600">
            {answeredQuestions} / {totalQuestions} вопросов
          </div>
        </div>
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </nav>
  );
};

export default DiagnosticsNavBar;
