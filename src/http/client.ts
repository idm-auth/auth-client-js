/**
 * Opções para requisições HTTP
 */
export interface HttpOptions {
  /** Cabeçalhos HTTP customizados */
  headers?: Record<string, string>;
}

/**
 * Interface para cliente HTTP
 *
 * Esta interface define o contrato mínimo que um cliente HTTP deve implementar
 * para ser usado com a biblioteca IDM Auth Client.
 *
 * O usuário pode implementar esta interface usando qualquer biblioteca HTTP:
 * - fetch (nativo)
 * - axios
 * - undici
 * - node-fetch
 * - qualquer outra biblioteca HTTP
 *
 * A biblioteca passará headers obrigatórios (Content-Type, X-IDM-System) através
 * do parâmetro options. Sua implementação deve mesclar estes com headers customizados.
 */
export interface IHttpClient {
  /**
   * Realiza requisição HTTP POST
   *
   * @param url - URL completa do endpoint
   * @param data - Dados a serem enviados no body (serão serializados para JSON)
   * @param options - Opções incluindo headers
   * @returns Promise com a resposta parseada
   */
  post<T>(url: string, data: unknown, options?: HttpOptions): Promise<T>;

  /**
   * Realiza requisição HTTP GET
   *
   * @param url - URL completa do endpoint
   * @param options - Opções incluindo headers
   * @returns Promise com a resposta parseada
   */
  get<T>(url: string, options?: HttpOptions): Promise<T>;
}
