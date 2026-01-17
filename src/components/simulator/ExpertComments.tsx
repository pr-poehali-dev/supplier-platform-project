import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ExpertComment {
  icon: string;
  text: string;
}

interface ExpertCommentsProps {
  comments: ExpertComment[];
}

const ExpertComments = ({ comments }: ExpertCommentsProps) => {
  if (comments.length === 0) {
    return null;
  }

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Lightbulb" className="text-primary" size={24} />
          Экспертные комментарии
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div key={index} className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-blue-600 flex-shrink-0">
                <Icon name={comment.icon as any} size={20} />
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                {comment.text}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpertComments;
