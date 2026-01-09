import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import DiagnosticsIntro from '@/components/diagnostics/DiagnosticsIntro';
import DiagnosticsNavBar from '@/components/diagnostics/DiagnosticsNavBar';
import DiagnosticsQuestion from '@/components/diagnostics/DiagnosticsQuestion';
import { diagnosticsBlocks } from '@/components/diagnostics/diagnosticsData';
import SubscriptionGuard from '@/components/SubscriptionGuard';

const Diagnostics = () => {
  const navigate = useNavigate();
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [started, setStarted] = useState(false);

  const currentBlock = diagnosticsBlocks[currentBlockIndex];
  const progress = ((currentBlockIndex + 1) / diagnosticsBlocks.length) * 100;
  const totalQuestions = diagnosticsBlocks.reduce((sum, block) => sum + block.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const blockAnswered = currentBlock.questions.every(q => answers[q.id] !== undefined);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentBlockIndex < diagnosticsBlocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      navigate('/diagnostics/results', { state: { answers } });
    }
  };

  const handleBack = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  if (!started) {
    return (
      <SubscriptionGuard feature="hasDiagnostics" featureName="диагностики бизнеса">
        <DiagnosticsIntro
          diagnosticsBlocks={diagnosticsBlocks}
          onStart={() => setStarted(true)}
        />
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard feature="hasDiagnostics" featureName="диагностики бизнеса">
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="Home" size={20} />
        На главную
      </Button>
      <DiagnosticsNavBar
        answeredQuestions={answeredQuestions}
        totalQuestions={totalQuestions}
        progress={progress}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <Badge className="mb-4">
            Блок {currentBlockIndex + 1} из {diagnosticsBlocks.length}
          </Badge>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon name={currentBlock.icon as any} className="text-primary" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-heading mb-2">{currentBlock.title}</h2>
              <p className="text-gray-600">{currentBlock.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {currentBlock.questions.map((question, index) => (
            <DiagnosticsQuestion
              key={question.id}
              question={question}
              index={index}
              selectedValue={answers[question.id]}
              onAnswer={(value) => handleAnswer(question.id, value)}
            />
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          {currentBlockIndex > 0 && (
            <Button onClick={handleBack} variant="outline" size="lg">
              <Icon name="ArrowLeft" className="mr-2" size={20} />
              Назад
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!blockAnswered}
            className="flex-1 bg-gradient-to-r from-primary to-secondary"
            size="lg"
          >
            {currentBlockIndex < diagnosticsBlocks.length - 1 ? 'Следующий блок' : 'Показать результаты'}
            <Icon name="ArrowRight" className="ml-2" size={20} />
          </Button>
        </div>
      </div>
    </SubscriptionGuard>
  );
};

export default Diagnostics;