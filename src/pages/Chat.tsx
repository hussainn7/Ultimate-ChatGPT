import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, Plus, MessageSquare, Settings, X, ChevronLeft } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import MessageInput from '../components/MessageInput';
import AdminPanel from '../components/AdminPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import { Message } from '../types/chat';

const modelInfo = (id: string) => {
    const map: Record<string, { label: string; provider: string }> = {
      'gpt-3.5-turbo': { label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
      'gpt-4o-mini': { label: 'GPT-4o Mini', provider: 'OpenAI' },
      'gpt-4o': { label: 'GPT-4o', provider: 'OpenAI' },
      'gpt-4-turbo': { label: 'GPT-4 Turbo', provider: 'OpenAI' },
      'deepseek-chat': { label: 'DeepSeek Chat', provider: 'DeepSeek' },
      'deepseek-coder': { label: 'DeepSeek Coder', provider: 'DeepSeek' },
    };
    return map[id] || { label: id, provider: '' };
  };

const Chat = () => {
  // Selected chat id persists
  const [selectedChatId, setSelectedChatId] = useState<string>(() => sessionStorage.getItem('selectedChatId') || '');
  type ChatSession = { id: string; title: string; date: string; messages: Message[] };
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [model, setModel] = useState<string>('gpt-3.5-turbo');
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    const stored = sessionStorage.getItem('chatHistory');
    return stored ? JSON.parse(stored) : [];
  });
    // Persist chat history changes
  useEffect(() => {
    sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    sessionStorage.setItem('selectedChatId', selectedChatId);
  }, [selectedChatId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('Received WebSocket message:', data);
    if (data.type === 'start') {
      setIsStreaming(true);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'assistant', 
        content: '',
        timestamp: new Date()
      }]);
    } else if (data.type === 'chunk') {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content += data.content;
        }
        return newMessages;
      });
    } else if (data.type === 'end') {
      setIsStreaming(false);
    } else if (data.type === 'error') {
      setIsStreaming(false);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'assistant', 
        content: `Error: ${data.error}`,
        timestamp: new Date()
      }]);
    }
  }, []);

  const handleWebSocketError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
    setIsStreaming(false);
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      role: 'assistant', 
      content: 'Connection error. Please try again.',
      timestamp: new Date()
    }]);
  }, []);

  const { sendMessage, isConnected } = useWebSocket(handleWebSocketMessage, handleWebSocketError);

  const handleSendMessage = useCallback(async (message: string) => {
    console.log('Sending message:', message, 'Connected:', isConnected);
    if (!message.trim()) return;

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    if (!isConnected) {
      console.error('WebSocket not connected');
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: 'Not connected to server. Please try again.',
        timestamp: new Date()
      }]);
      return;
    }

    try {
      sendMessage(message, model);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: 'Error sending message. Please try again.',
        timestamp: new Date()
      }]);
    }
  }, [model, sendMessage, isConnected]);

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

  const simulateAIResponse = (userMessage: string) => {
    setIsStreaming(true);
    
    const aiMessage: Message = {
      id: Date.now() + 1,
      content: '',
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => {
      const updated = [...prev, aiMessage];
      setChatHistory(chats => chats.map(c => c.id===selectedChatId? { ...c, messages: updated }: c));
      return updated;
    });

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
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content += responses[responseIndex][charIndex];
            }
            setChatHistory(chats => chats.map(c => c.id===selectedChatId? { ...c, messages: newMessages }: c));
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
        setIsStreaming(false);
      }
    };

    setTimeout(typeResponse, 500);
  };

  const startNewChat = () => {
    const newChat: ChatSession = { id: Date.now().toString(), title: `Чат ${chatHistory.length + 1}`, date: new Date().toLocaleDateString(), messages: [] };
    setChatHistory(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
    setMessages([]);
  };

  const handleAdminSave = (newModel: string) => {
    setModel(newModel);
    setIsAdminPanelOpen(false);
  };

  const isGuest = localStorage.getItem('guest') === 'true';

  // Group sessions by date for sidebar rendering
  const groupedHistory = React.useMemo(() => {
    if (isGuest) return {}; // guests don't persist history
    return chatHistory.reduce<Record<string, ChatSession[]>>((acc, chat) => {
      (acc[chat.date] ||= []).push(chat);
      return acc;
    }, {});
  }, [chatHistory, isGuest]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${
        isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'
      } lg:static lg:inset-0`}>
        <div className={`flex flex-col h-full ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            {isGuest ? (
              <div className="w-full p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                Войдите, чтобы сохранять историю чатов
              </div>
            ) : (
              <button
                onClick={startNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={18} />
                <span className="font-medium">Новый чат</span>
              </button>
            )}
            {/* Close sidebar on mobile */}
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden" title="Скрыть меню">
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">История чатов</h3>
            <div className="space-y-4">
              {Object.entries(groupedHistory).map(([date, chats]) => (
                <div key={date} className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/70 px-1">{date}</p>
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => { setSelectedChatId(chat.id); setMessages(chat.messages); }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors group ${chat.id===selectedChatId?'bg-muted':'hover:bg-muted'}`}
                    >
                      <MessageSquare size={16} className="text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">{chat.date}</p>
                      </div>
                    </div>
                  ))}
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
                <h1 className="text-lg font-semibold">{chatHistory.find(c=>c.id===selectedChatId)?.title || 'AI Chat'}</h1>
                <p className="text-sm text-muted-foreground">
                  {`${modelInfo(model).label} • ${modelInfo(model).provider}`}
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
                    <div className="text-4xl mb-4">🤖</div>
                    <h2 className="text-xl font-medium mb-2">Добро пожаловать в ИИ помощника</h2>
                    <p className="text-muted-foreground">
                      Начните разговор, написав сообщение ниже
                    </p>
                  </div>
                )}
                
                <div className="space-y-6">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Input */}
            <div className="border-t border-border bg-background p-4">
              <div className="max-w-3xl mx-auto">
                <MessageInput 
                  onSendMessage={handleSendMessage}
                  disabled={isStreaming}
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
          currentModel={model}
        />
      )}
    </div>
  );
};

export default Chat;
