import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  message: string;
  provider?: string;
  model?: string;
  token?: string;
  chatSessionId?: number;
}

interface WebSocketResponse {
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  error?: string;
}

interface UseWebSocketProps {
  onMessage: (data: WebSocketResponse) => void;
  url?: string;
}

export const useWebSocket = ({ onMessage, url = 'ws://localhost:8000/ws' }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      console.log('Attempting to connect WebSocket...');
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketResponse = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          onMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection failed');
        setIsConnected(false);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create connection');
      setIsConnected(false);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Get token from localStorage
      const token = localStorage.getItem('et_token');
      console.log('Token from localStorage:', token ? 'Present' : 'Not found');
      
      const messageWithToken = { 
        ...message, 
        token: token ? `Bearer ${token}` : undefined 
      };
      console.log('Sending WebSocket message:', { 
        ...messageWithToken, 
        token: messageWithToken.token ? 'Present' : 'Not found' 
      });
      
      wsRef.current.send(JSON.stringify(messageWithToken));
    } else {
      console.warn('WebSocket is not connected, state:', wsRef.current?.readyState);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    error,
    sendMessage,
    disconnect
  };
};
