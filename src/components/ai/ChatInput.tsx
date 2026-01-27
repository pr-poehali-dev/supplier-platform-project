import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useRef, useEffect } from 'react';

interface ChatInputProps {
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: (text?: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function ChatInput({ input, loading, onInputChange, onSend, onKeyPress }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  return (
    <div className="px-5 py-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Спросите о чём угодно..."
            disabled={loading}
            className="flex-1 min-h-[42px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 text-sm px-4 py-3"
            rows={1}
          />
          <Button 
            onClick={() => onSend()} 
            disabled={loading || !input.trim()} 
            size="icon"
            className="h-[42px] w-[42px] rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded">Enter</kbd> — отправить, <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded">Shift + Enter</kbd> — новая строка
        </p>
    </div>
  );
}