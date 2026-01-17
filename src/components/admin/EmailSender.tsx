import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface EmailSenderProps {
  subject: string;
  message: string;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}

export default function EmailSender({
  subject,
  message,
  onSubjectChange,
  onMessageChange,
  onSend,
  sending
}: EmailSenderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Mail" size={24} />
          Email рассылка
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email-subject">Тема письма</Label>
          <Input
            id="email-subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Новые возможности TOURCONNECT"
            disabled={sending}
          />
        </div>
        <div>
          <Label htmlFor="email-message">Текст письма</Label>
          <Textarea
            id="email-message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Здравствуйте! Мы рады сообщить..."
            rows={8}
            disabled={sending}
          />
        </div>
        <Button
          onClick={onSend}
          disabled={sending || !subject.trim() || !message.trim()}
          className="w-full"
        >
          {sending ? (
            <>
              <Icon name="Loader2" className="animate-spin mr-2" size={18} />
              Отправка...
            </>
          ) : (
            <>
              <Icon name="Send" className="mr-2" size={18} />
              Отправить всем пользователям
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
