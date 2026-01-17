import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Step {
  number: number;
  title: string;
  description: string | React.ReactNode;
  details?: React.ReactNode;
  image?: string;
}

interface PlatformGuideProps {
  title: string;
  icon: string;
  color: string;
  steps: Step[];
}

export default function PlatformGuide({ title, icon, color, steps }: PlatformGuideProps) {
  return (
    <Card className={`mb-12 border-2 shadow-xl ${color}`}>
      <CardHeader className={`bg-gradient-to-r text-white ${color.includes('orange') ? 'from-orange-500 to-red-500' : 'from-blue-500 to-purple-500'}`}>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6">
              <div className={`w-12 h-12 rounded-full ${color.includes('orange') ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'} flex items-center justify-center flex-shrink-0 text-white text-xl font-bold`}>
                {step.number}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold mb-3">{step.title}</h4>
                {typeof step.description === 'string' ? (
                  <p className="text-gray-700 mb-4">{step.description}</p>
                ) : (
                  <div className="mb-4">{step.description}</div>
                )}
                {step.details}
                {step.image && (
                  <img 
                    src={step.image}
                    alt={`${title} - шаг ${step.number}`}
                    className="rounded-lg border-2 border-gray-200 w-full shadow-md"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
