import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface QuestionOption {
  value: number;
  label: string;
  icon: string;
}

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

interface DiagnosticsQuestionProps {
  question: Question;
  index: number;
  selectedValue: number | undefined;
  onAnswer: (value: number) => void;
}

const DiagnosticsQuestion = ({ question, index, selectedValue, onAnswer }: DiagnosticsQuestionProps) => {
  return (
    <Card className={selectedValue !== undefined ? 'border-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="text-lg">
          {index + 1}. {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {question.options.map(option => (
            <button
              key={option.value}
              onClick={() => onAnswer(option.value)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedValue === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedValue === option.value
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}
              >
                {selectedValue === option.value && (
                  <Icon name="Check" className="text-white" size={16} />
                )}
              </div>
              <Icon
                name={option.icon as any}
                className={
                  option.value === 0
                    ? 'text-red-500'
                    : option.value === 1
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }
                size={20}
              />
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiagnosticsQuestion;
