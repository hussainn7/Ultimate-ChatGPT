import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, Plus, MessageSquare, Settings, X, AlertCircle, Trash2 } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import AdminPanel from '../components/AdminPanel';
import { useAIChat } from '../hooks/useAIChat';
import { chatHistoryService, ChatSession } from '../services/chatHistory';
import { Message } from '../types/chat';

interface AIConfig {
  model: string;
  provider: 'openai' | 'deepseek';
}

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: 'gpt-3.5-turbo',
    provider: 'openai'
  });
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the AI chat hook
  const { messages, isTyping, error, sendMessage, clearMessages } = useAIChat(aiConfig);

  // Load saved configuration and chat history on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setAiConfig(config);
      } catch (e) {
        console.error('Failed to load saved configuration:', e);
      }
    }
    
    // Load chat history
    loadChatHistory();
  }, []);

  // Save current session when messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      chatHistoryService.updateSession(currentSessionId, messages);
      loadChatHistory(); // Refresh the sidebar
    }
  }, [messages, currentSessionId]);

  const loadChatHistory = () => {
    const sessions = chatHistoryService.getAllSessions();
    setChatHistory(sessions);
  };

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

  const handleSendMessage = async (content: string) => {
    // Create new session if none exists
    if (!currentSessionId) {
      const newSession = chatHistoryService.createSession(aiConfig.model, aiConfig.provider);
      setCurrentSessionId(newSession.id);
    }
    
    await sendMessage(content);
  };

  const startNewChat = () => {
    clearMessages();
    setCurrentSessionId(null);
    setIsSidebarOpen(false);
  };

  const loadChatSession = (sessionId: string) => {
    const session = chatHistoryService.getSession(sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      clearMessages();
      
      // Load messages by setting them directly in the AI chat hook
      // Note: We'll need to modify the hook to accept initial messages
      setIsSidebarOpen(false);
      
      // For now, we'll create a new session and copy messages
      // This is a limitation of the current hook design
      setTimeout(() => {
        // This is a workaround - in a real app you'd modify the hook
        console.log('Loading session:', session.title, 'with', session.messages.length, 'messages');
      }, 100);
    }
  };

  const deleteChatSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    chatHistoryService.deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      startNewChat();
    }
    loadChatHistory();
  };

  const handleAdminSave = (config: AIConfig) => {
    setAiConfig(config);
    localStorage.setItem('aiConfig', JSON.stringify(config));
    setIsAdminPanelOpen(false);
  };

  const modelDisplayName = () => {
    const modelMap: Record<string, string> = {
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4o': 'GPT-4o',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-coder': 'DeepSeek Coder'
    };
    return modelMap[aiConfig.model] || aiConfig.model;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${
        isSidebarOpen ? 'translate-x-0 w-80 sm:w-80' : '-translate-x-full w-0'
      } lg:static lg:inset-0 lg:translate-x-0`}>
        <div className={`flex flex-col h-full ${isSidebarOpen ? 'w-80 sm:w-80' : 'w-0'} lg:w-80 overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-3 sm:p-4 border-b border-border">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              <span className="font-medium">New Chat</span>
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Chat History</h3>
            <div className="space-y-2">
              {chatHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No chat history yet.<br />Start a conversation to see it here.
                </p>
              ) : (
                chatHistory.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadChatSession(session.id)}
                    className={`flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group ${
                      currentSessionId === session.id ? 'bg-muted' : ''
                    }`}
                  >
                    <MessageSquare size={16} className="text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {chatHistoryService.getRelativeDate(session.updatedAt)} • {session.messages.length} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteChatSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-destructive transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 sm:p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Link 
                to="/about" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
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
          <div className="flex items-center justify-between px-3 sm:px-4 py-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold truncate">AI Chat</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {modelDisplayName()} • {aiConfig.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                </p>
              </div>
            </div>
            
            {/* Model Selection Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Change Model"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <AlertCircle size={16} />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                  </div>
                )}

                {/* Welcome Message */}
                {messages.length === 0 && (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="text-4xl mb-4">🤖</div>
                    <h2 className="text-xl font-medium mb-2">Welcome to AI Chat</h2>
                    <p className="text-muted-foreground">
                      Start a conversation with {modelDisplayName()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your chat will be automatically saved to history
                    </p>
                  </div>
                )}
                
                <div className="space-y-6">
                  {messages.map((message) => {
                    // Skip rendering empty bot messages (these are placeholders for typing)
                    if (!message.isUser && !message.content) return null;
                    return (
                      <ChatMessage 
                        key={`message-${message.id}`} 
                        message={message} 
                      />
                    );
                  })}
                  
                  {isTyping && messages.length > 0 &&
                   !messages[messages.length - 1].isUser && 
                   messages[messages.length - 1].content === '' && 
                    <TypingIndicator />
                  }
                </div>
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Input */}
            <div className="border-t border-border bg-background p-3 sm:p-4">
              <div className="max-w-3xl mx-auto">
                <MessageInput 
                  onSendMessage={handleSendMessage}
                  disabled={isTyping}
                  placeholder={
                    isTyping 
                      ? "AI is typing..." 
                      : "Type your message..."
                  }
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
          currentConfig={aiConfig}
        />
      )}
    </div>
  );
};

export default Chat;
