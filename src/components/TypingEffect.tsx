
import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="group animate-fade-in bg-muted/30">
      <div className="max-w-none mx-auto px-4 py-6">
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-foreground text-background flex items-center justify-center">
            <Bot size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 py-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
