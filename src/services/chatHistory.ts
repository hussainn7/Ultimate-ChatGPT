import { Message } from '../types/chat';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  provider: 'openai' | 'deepseek';
}

class ChatHistoryService {
  private readonly STORAGE_KEY = 'chatHistory';
  private readonly MAX_SESSIONS = 50;

  // Get all chat sessions
  getAllSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }

  // Get a specific session by ID
  getSession(id: string): ChatSession | null {
    const sessions = this.getAllSessions();
    return sessions.find(session => session.id === id) || null;
  }

  // Save or update a session
  saveSession(session: ChatSession): void {
    try {
      const sessions = this.getAllSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }

      // Keep only the most recent sessions
      const trimmedSessions = sessions.slice(0, this.MAX_SESSIONS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedSessions));
    } catch (error) {
      console.error('Failed to save chat session:', error);
    }
  }

  // Create a new session
  createSession(model: string, provider: 'openai' | 'deepseek'): ChatSession {
    const now = new Date();
    return {
      id: this.generateSessionId(),
      title: 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
      model,
      provider
    };
  }

  // Update session with new message
  updateSession(sessionId: string, messages: Message[]): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    // Generate title from first user message if still "New Chat"
    if (session.title === 'New Chat' && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.isUser);
      if (firstUserMessage) {
        session.title = this.generateTitle(firstUserMessage.content);
      }
    }

    session.messages = messages;
    session.updatedAt = new Date();
    this.saveSession(session);
  }

  // Delete a session
  deleteSession(id: string): void {
    try {
      const sessions = this.getAllSessions();
      const filteredSessions = sessions.filter(session => session.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions));
    } catch (error) {
      console.error('Failed to delete chat session:', error);
    }
  }

  // Clear all sessions
  clearAllSessions(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate a title from message content
  private generateTitle(content: string): string {
    // Take first 50 characters and clean up
    let title = content.trim().substring(0, 50);
    
    // Remove markdown formatting
    title = title.replace(/[#*`_~]/g, '');
    
    // Add ellipsis if truncated
    if (content.length > 50) {
      title += '...';
    }
    
    return title || 'Untitled Chat';
  }

  // Get formatted date for display
  getRelativeDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const chatHistoryService = new ChatHistoryService(); 