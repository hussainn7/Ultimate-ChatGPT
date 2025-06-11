
import React from 'react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className={`flex animate-fade-in ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] md:max-w-[70%] ${message.isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            message.isUser
              ? 'bg-primary text-primary-foreground ml-4'
              : 'bg-muted text-foreground mr-4'
          }`}
        >
          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: formatContent(message.content)
            }}
          />
        </div>
        <div className={`text-xs text-muted-foreground mt-1 px-2 ${
          message.isUser ? 'text-right' : 'text-left'
        }`}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      <div className={`flex-shrink-0 ${message.isUser ? 'order-1' : 'order-2'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          message.isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {message.isUser ? '👤' : '🤖'}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
