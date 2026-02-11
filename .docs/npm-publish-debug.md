# NPM Publish Debug Log

## Situação Atual
- **Problema**: Trusted publishing não funciona - "Access token expired or revoked" + 404
- **Pacote**: @idm-auth/auth-client v0.1.6 (publicado manualmente)
- **Versão tentando**: 0.1.7
- **Restrição**: NÃO usar token clássico - DEVE usar trusted publishing OIDC

## Configurações Verificadas
✅ Trusted publisher configurado no NPM:
  - Organization: idm-auth
  - Repository: auth-client-js
  - Workflow: publish.yml
  - Environment: testado com "prod" e em branco

✅ Publishing access: "Require two-factor authentication or a granular access token with bypass 2fa enabled"

✅ Permissões: pauloferreira25 é Owner da org idm-auth

✅ Provenance funcionando: sigstore logs sendo gerados (https://search.sigstore.dev/?logIndex=938712717)

✅ Workflow configurado:
  - id-token: write
  - registry-url: https://registry.npmjs.org
  - --provenance flag
  - environment: prod (testado com e sem)

✅ 2FA habilitado na conta pessoal pauloferreira25

## Erro Persistente
```
npm notice Access token expired or revoked. Please try logging in again.
npm error code E404
npm error 404 Not Found - PUT https://registry.npmjs.org/@idm-auth%2fauth-client
```

## Tentativas Realizadas (TODAS FALHARAM)
1. ❌ Configurar trusted publisher com environment "prod"
2. ❌ Configurar trusted publisher sem environment (em branco)
3. ❌ Mudar publishing access para primeira opção
4. ❌ Deletar pacote @idm-auth/client original
5. ❌ Criar novo pacote @idm-auth/auth-client
6. ❌ Publicar manualmente v0.1.6 e depois tentar v0.1.7 via Actions
7. ❌ Deletar e recriar trusted publisher múltiplas vezes
8. ❌ Adicionar NODE_AUTH_TOKEN (testado mas não é a solução correta)
9. ❌ Remover NODE_AUTH_TOKEN
10. ❌ Adicionar/remover environment do workflow

## Status Atual do Workflow
```yaml
environment: prod
permissions:
  contents: read
  id-token: write
registry-url: 'https://registry.npmjs.org'
npm publish --provenance --access public
env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Próxima Ação
- Deletar trusted publisher no NPM
- Esperar 5-10 minutos (cache/propagação)
- Recriar trusted publisher do zero
- Tentar release 0.1.8
