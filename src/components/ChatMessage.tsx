
import React from 'react';
import { Copy, User, Bot } from 'lucide-react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className={`group animate-fade-in ${message.isUser ? 'bg-transparent' : 'bg-muted/30'}`}>
      <div className="max-w-none mx-auto px-4 py-6">
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center ${
            message.isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-foreground text-background'
          }`}>
            {message.isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatContent(message.content)
                }}
              />
            </div>
            
            {/* Actions */}
            {!message.isUser && message.content && (
              <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Копировать"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
