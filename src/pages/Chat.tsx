
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ChatMessage from '../components/ChatMessage';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import { useWebSocket } from '../hooks/useWebSocket';
import { Message } from '../types/chat';

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'start') {
        setIsTyping(true);
        // Add new AI message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: '',
          isUser: false,
          timestamp: new Date()
        }]);
      } else if (data.type === 'chunk') {
        // Update the last message with new content
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to WebSocket
    if (isConnected) {
      sendMessage({ message: content });
    } else {
      // Fallback simulation if WebSocket is not connected
      simulateAIResponse(content);
    }
  };

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    // Add AI message
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);

    // Simulate streaming response
    const responses = [
      "I understand your question about: " + userMessage,
      "\n\nThis is a simulated AI response that demonstrates the typing effect. ",
      "In a real implementation, this would be connected to your FastAPI backend via WebSocket. ",
      "The response streams in character by character to create a natural conversation flow.",
      "\n\nEach message supports **markdown** formatting and maintains conversation context."
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
          setTimeout(typeResponse, 20 + Math.random() * 40); // Variable typing speed
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">AI Chat</h1>
            <p className="text-sm text-muted-foreground">
              Powered by advanced AI • {isConnected ? 'Connected' : 'Simulated mode'}
            </p>
          </div>
          <Link 
            to="/about" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12 animate-fade-in">
                <div className="text-4xl mb-4">💬</div>
                <h2 className="text-xl font-medium mb-2">Welcome to AI Chat</h2>
                <p className="text-muted-foreground">
                  Start a conversation by typing a message below
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <MessageInput 
              onSendMessage={handleSendMessage}
              disabled={isTyping}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
