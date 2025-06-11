export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  provider: 'openai' | 'deepseek';
}

export interface StreamResponse {
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  error?: string;
}

class AIService {
  private readonly OPENAI_BASE_URL = 'https://api.openai.com/v1';
  private readonly DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

  async *streamChat(
    messages: AIMessage[],
    config: AIServiceConfig,
    onProgress?: (response: StreamResponse) => void
  ): AsyncGenerator<string, void, unknown> {
    const { apiKey, model, provider } = config;
    
    const baseUrl = provider === 'openai' ? this.OPENAI_BASE_URL : this.DEEPSEEK_BASE_URL;
    const url = `${baseUrl}/chat/completions`;

    try {
      onProgress?.({ type: 'start' });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              onProgress?.({ type: 'end' });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                onProgress?.({ type: 'chunk', content });
                yield content;
              }
            } catch (e) {
              // Skip malformed JSON chunks
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      onProgress?.({ type: 'end' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onProgress?.({ type: 'error', error: errorMessage });
      throw error;
    }
  }

  async sendMessage(
    messages: AIMessage[],
    config: AIServiceConfig,
    onProgress: (response: StreamResponse) => void
  ): Promise<void> {
    try {
      const stream = this.streamChat(messages, config, onProgress);
      
      // Consume the stream to trigger the callbacks
      for await (const chunk of stream) {
        // The onProgress callback handles the UI updates
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      onProgress({ type: 'error', error: errorMessage });
    }
  }
}

export const aiService = new AIService(); 