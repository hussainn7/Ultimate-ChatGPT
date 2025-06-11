import { useState, useCallback } from 'react';
import { aiService, AIMessage, AIServiceConfig, StreamResponse } from '../services/aiService';
import { Message } from '../types/chat';
import { API_KEYS } from '../config/apiKeys';

interface UseAIChatConfig {
  model: string;
  provider: 'openai' | 'deepseek';
}

interface UseAIChatReturn {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export const useAIChat = (config: UseAIChatConfig): UseAIChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const { model, provider } = config;
    
    // Get API key from hardcoded configuration
    const apiKey = provider === 'openai' ? API_KEYS.openai : API_KEYS.deepseek;
    
    // Validate that API key is configured
    if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey === 'your-deepseek-api-key-here') {
      setError(`${provider === 'openai' ? 'OpenAI' : 'DeepSeek'} API key is not configured. Please update src/config/apiKeys.ts`);
      return;
    }

    let userMessage: Message;
    let aiMessage: Message;

    // Create user message and add it
    setMessages(prev => {
      userMessage = {
        id: Date.now().toString(),
        content,
        isUser: true,
        timestamp: new Date()
      };
      return [...prev, userMessage];
    });
    
    setError(null);

    // Create initial AI message and add it
    setMessages(prev => {
      aiMessage = {
        id: (Date.now() + 1).toString(),
        content: '',
        isUser: false,
        timestamp: new Date()
      };
      
      // Prepare AI messages for API using current state
      const aiMessages: AIMessage[] = [
        ...prev.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content
        }
      ];

      // Prepare AI service config
      const aiConfig: AIServiceConfig = {
        apiKey,
        model,
        provider
      };

      const onProgress = (response: StreamResponse) => {
        switch (response.type) {
          case 'start':
            setIsTyping(true);
            break;
          
          case 'chunk':
            if (response.content) {
              setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && !lastMessage.isUser) {
                  lastMessage.content += response.content;
                }
                return newMessages;
              });
            }
            break;
          
          case 'end':
            setIsTyping(false);
            break;
          
          case 'error':
            setIsTyping(false);
            setError(response.error || 'An error occurred');
            // Remove the empty AI message on error
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && !lastMessage.isUser && !lastMessage.content) {
                newMessages.pop();
              }
              return newMessages;
            });
            break;
        }
      };

      // Start the API call
      aiService.sendMessage(aiMessages, aiConfig, onProgress).catch(error => {
        console.error('Error sending message:', error);
        setIsTyping(false);
        setError(error instanceof Error ? error.message : 'Failed to send message');
      });

      return [...prev, aiMessage];
    });
  }, [config]);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    clearMessages
  };
}; 