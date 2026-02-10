/**
 * Requisição de validação de autenticação
 *
 * Valida se um token de autenticação é válido e retorna informações do usuário.
 * Mesmo que um token JWT seja tecnicamente válido (assinatura correta, não expirado),
 * o backend IdmAuth realiza validações contextuais adicionais:
 * - Status da conta (ativa, bloqueada, deletada)
 * - Validade da sessão (não revogada)
 * - Validação de IP (opcional)
 * - Validação de User-Agent (opcional)
 * - Mudanças de permissões desde que o token foi emitido
 */
export interface AuthenticationValidationRequest {
  /**
   * Identificador do sistema/aplicação que está validando o token
   *
   * Este campo identifica qual sistema está fazendo a validação.
   * Exemplos: 'iam', 'storage', 'billing', 'my-app'
   *
   * Usado para:
   * - Telemetria e auditoria
   * - Políticas específicas por sistema
   * - Rate limiting por aplicação
   */
  system: string;

  /**
   * Token de autenticação a ser validado
   *
   * Pode ser:
   * - JWT (JSON Web Token)
   * - API Key
   * - OAuth token
   * - Qualquer formato aceito pelo IdmAuth
   */
  token: string;

  /**
   * Public UUID do Realm no IdmAuth onde o token foi emitido
   *
   * Identifica qual realm do IdmAuth deve validar este token.
   * Cada realm tem suas próprias:
   * - Chaves de assinatura
   * - Políticas de validação
   * - Configurações de segurança
   *
   * IMPORTANTE: Este é o PUBLIC UUID do realm (não o ID interno)
   */
  applicationRealmPublicUUID: string;
}

/**
 * Resposta da validação de autenticação
 */
export interface AuthenticationValidationResponse {
  /**
   * Indica se o token é válido
   *
   * true: Token válido e usuário autenticado
   * false: Token inválido, expirado, ou usuário sem acesso
   */
  valid: boolean;

  /**
   * ID da conta do usuário autenticado
   *
   * Presente apenas quando valid=true
   * Usado para identificar o usuário em requisições subsequentes
   */
  accountId?: string;

  /**
   * Mensagem de erro quando a validação falha
   *
   * Presente apenas quando valid=false
   * Exemplos: 'Token expired', 'Invalid signature', 'Account blocked'
   */
  error?: string;
}
