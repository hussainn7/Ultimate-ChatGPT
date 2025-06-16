import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  message: string;
  provider?: string;
  model?: string;
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
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketResponse = JSON.parse(event.data);
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
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
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
