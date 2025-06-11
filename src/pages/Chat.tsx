
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, Plus, MessageSquare, Settings, X } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import AdminPanel from '../components/AdminPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import { Message } from '../types/chat';

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [chatHistory, setChatHistory] = useState<{ id: string; title: string; date: string }[]>([
    { id: '1', title: 'Вопрос о программировании', date: 'Сегодня' },
    { id: '2', title: 'Помощь с дизайном', date: 'Вчера' },
    { id: '3', title: 'Обсуждение проекта', date: '2 дня назад' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'start') {
        setIsTyping(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: '',
          isUser: false,
          timestamp: new Date()
        }]);
      } else if (data.type === 'chunk') {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && !lastMessage.isUser) {
            lastMessage.content += data.content;
          }
          return newMessages;
        });
      } else if (data.type === 'end') {
        setIsTyping(false);
      }
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    if (isConnected) {
      sendMessage({ message: content, apiKey, model: selectedModel });
    } else {
      simulateAIResponse(content);
    }
  };

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);

    const responses = [
      "Я понимаю ваш вопрос о: " + userMessage,
      "\n\nЭто симуляция ответа ИИ, которая демонстрирует эффект печати. ",
      "В реальной реализации это будет подключено к вашему FastAPI бэкенду через WebSocket. ",
      "Ответ транслируется символ за символом для создания естественного потока разговора.",
      "\n\nКаждое сообщение поддерживает **форматирование markdown** и сохраняет контекст беседы."
    ];

    let responseIndex = 0;
    let charIndex = 0;

    const typeResponse = () => {
      if (responseIndex < responses.length) {
        if (charIndex < responses[responseIndex].length) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.content += responses[responseIndex][charIndex];
            }
            return newMessages;
          });
          charIndex++;
          setTimeout(typeResponse, 20 + Math.random() * 40);
        } else {
          responseIndex++;
          charIndex = 0;
          setTimeout(typeResponse, 100);
        }
      } else {
        setIsTyping(false);
      }
    };

    setTimeout(typeResponse, 500);
  };

  const startNewChat = () => {
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleAdminSave = (newApiKey: string, newModel: string) => {
    setApiKey(newApiKey);
    setSelectedModel(newModel);
    setIsAdminPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${
        isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'
      } lg:static lg:inset-0`}>
        <div className={`flex flex-col h-full ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              <span className="font-medium">Новый чат</span>
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">История чатов</h3>
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                >
                  <MessageSquare size={16} className="text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">{chat.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Link 
                to="/about" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                О приложении
              </Link>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-lg font-semibold">ChatGPT</h1>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Подключено' : 'Режим симуляции'}
                </p>
              </div>
            </div>
            
            {/* Admin Panel Button */}
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Настройки администратора"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-6">
                {messages.length === 0 && (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="text-4xl mb-4">💬</div>
                    <h2 className="text-xl font-medium mb-2">Добро пожаловать в ChatGPT</h2>
                    <p className="text-muted-foreground">
                      Начните разговор, написав сообщение ниже
                    </p>
                  </div>
                )}
                
                <div className="space-y-6">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  
                  {isTyping && <TypingIndicator />}
                </div>
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Input */}
            <div className="border-t border-border bg-background p-4">
              <div className="max-w-3xl mx-auto">
                <MessageInput 
                  onSendMessage={handleSendMessage}
                  disabled={isTyping}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Admin Panel Modal */}
      {isAdminPanelOpen && (
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          onSave={handleAdminSave}
          currentApiKey={apiKey}
          currentModel={selectedModel}
        />
      )}
    </div>
  );
};

export default Chat;
