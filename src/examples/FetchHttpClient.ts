import { IHttpClient, HttpOptions } from '../http';

/**
 * Implementação de IHttpClient usando Fetch API nativa
 *
 * Esta é uma implementação de exemplo que usa a Fetch API do navegador/Node.js.
 * Inclui:
 * - Timeout configurável
 * - Tratamento de erros HTTP
 * - Serialização automática de JSON
 * - Abortar requisições em timeout
 *
 * Você pode usar esta implementação diretamente ou criar sua própria
 * implementando a interface IHttpClient.
 */
export class FetchHttpClient implements IHttpClient {
  /**
   * @param timeout - Tempo máximo de espera em milissegundos (padrão: 5000ms)
   */
  constructor(private timeout = 5000) {}

  async post<T>(url: string, data: unknown, options?: HttpOptions): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json() as T;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(url: string, options?: HttpOptions): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...options?.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json() as T;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
