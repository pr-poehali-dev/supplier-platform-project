import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface ChatInputProps {
  input: string;
  loading: boolean;
  messagesCount: number;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function ChatInput({ input, loading, messagesCount, onInputChange, onSend, onKeyPress }: ChatInputProps) {
  return (
    <>
      {messagesCount <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onInputChange('Какая загрузка на ближайший месяц?')} className="text-xs">
              📊 Загрузка
            </Button>
            <Button variant="outline" size="sm" onClick={() => onInputChange('Как оптимизировать цены?')} className="text-xs">
              💰 Цены
            </Button>
            <Button variant="outline" size="sm" onClick={() => onInputChange('Советы по продвижению')} className="text-xs">
              📢 Маркетинг
            </Button>
          </div>
        </div>
      )}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Напишите сообщение..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={onSend} disabled={loading || !input.trim()} size="icon">
            <Icon name="Send" size={18} />
          </Button>
        </div>
      </div>
    </>
  );
}
