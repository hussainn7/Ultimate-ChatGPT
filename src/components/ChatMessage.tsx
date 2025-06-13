import React from 'react';
import { Copy, User, Bot } from 'lucide-react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
  onCopy?: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message, onCopy }) => {
  const [copied, setCopied] = React.useState(false);

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  const copyToClipboard = () => {
    // Try Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          setCopied(true);
          if (onCopy) onCopy(message.content);
          setTimeout(() => setCopied(false), 1000);
        })
        .catch(() => {
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      // Avoid scrolling to bottom
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        if (onCopy) onCopy(message.content);
        setTimeout(() => setCopied(false), 1000);
      } catch (err) {
        // Optionally show error
      }
      document.body.removeChild(textArea);
    }
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
              <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity relative">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Копировать"
                >
                  <Copy size={14} />
                </button>
                {copied && (
                  <span className="absolute left-full ml-2 px-2 py-1 rounded bg-primary text-primary-foreground text-xs shadow animate-fade-in">
                    Copied!
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatMessage;
