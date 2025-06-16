import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketMessage {
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  error?: string;
}

interface WebSocketHook {
  sendMessage: (message: string, model: string) => void;
  isConnected: boolean;
}

export const useWebSocket = (
  onMessage: (data: WebSocketMessage) => void,
  onError: (error: any) => void
): WebSocketHook => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseDelay = 1000;
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    console.log('Attempting to connect WebSocket...');
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Check if user is guest
    const isGuest = localStorage.getItem('guest') === 'true';
    if (isGuest) {
      console.log('Guest user - connecting without token');
      try {
        const wsUrl = 'ws://localhost:8000/ws';
        console.log('Connecting to WebSocket:', wsUrl);
        ws.current = new WebSocket(wsUrl);
        setupWebSocketHandlers();
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        onError(error);
      }
      return;
    }

    // Regular user - check token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      onError(new Error('No authentication token found'));
      return;
    }

    try {
      const wsUrl = `ws://localhost:8000/ws?token=${token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);
      setupWebSocketHandlers();
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      onError(error);
    }
  }, [onMessage, onError]);

  const setupWebSocketHandlers = () => {
    if (!ws.current) return;

    ws.current.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        onError(error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      onError(error);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
      
      // Attempt to reconnect if not closed cleanly
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        onError(new Error('Failed to reconnect after multiple attempts'));
      }
    };
  };

  useEffect(() => {
    console.log('Initializing WebSocket connection...');
    connect();

    return () => {
      console.log('Cleaning up WebSocket connection...');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: string, model: string) => {
    console.log('Sending message:', { message, model });
    if (ws.current?.readyState === WebSocket.OPEN) {
      const data = JSON.stringify({ message, model });
      console.log('Sending WebSocket data:', data);
      ws.current.send(data);
    } else {
      console.error('WebSocket is not connected');
      onError(new Error('WebSocket is not connected'));
    }
  }, [onError]);

  return {
    sendMessage,
    isConnected
  };
}; 