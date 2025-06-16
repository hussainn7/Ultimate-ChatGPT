export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  isConnected: boolean;
}
