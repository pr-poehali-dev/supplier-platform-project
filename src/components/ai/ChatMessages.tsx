import Icon from '@/components/ui/icon';
import { useEffect, useState, RefObject } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  scrollContainerRef: RefObject<HTMLDivElement>;
  onScrollChange: (show: boolean) => void;
}

export default function ChatMessages({ messages, loading, scrollContainerRef, onScrollChange }: ChatMessagesProps) {
  const [userScrolled, setUserScrolled] = useState(false);

  useEffect(() => {
    if (scrollContainerRef.current && !userScrolled) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, userScrolled]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setUserScrolled(!isAtBottom);
    onScrollChange(!isAtBottom);
  };

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scroll-smooth"
      style={{ scrollbarWidth: 'thin' }}
    >
      {messages.map((msg, idx) => (
        <div 
          key={idx} 
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          {msg.role === 'assistant' && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
              <Icon name="Bot" size={14} className="text-white" />
            </div>
          )}
          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
            msg.role === 'user'
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-900 border border-gray-100'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            <p className={`text-xs mt-1.5 ${
              msg.role === 'user' ? 'text-indigo-100' : 'text-gray-400'
            }`}>
              {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start animate-in fade-in duration-200">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 mt-1">
            <Icon name="Bot" size={14} className="text-white" />
          </div>
          <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}