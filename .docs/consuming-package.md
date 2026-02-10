# Exemplo: Usando @idm-auth/client em Outro Projeto

## Estrutura do Projeto Consumidor

```
meu-backend/
├── .github/
│   └── workflows/
│       └── ci.yml          # ← Workflow que usa o pacote
├── src/
│   └── index.ts
├── .npmrc                  # ← Configuração do registry
└── package.json
```

## 1. Configurar .npmrc

Criar `.npmrc` na raiz do projeto:

```
@idm-auth:registry=https://npm.pkg.github.com
```

## 2. Instalar o Pacote

```bash
npm install @idm-auth/client
```

## 3. Usar no Código

```typescript
// src/index.ts
import { validateAuthentication, FetchHttpClient } from '@idm-auth/client';

const httpClient = new FetchHttpClient(5000);

const result = await validateAuthentication(
  httpClient,
  process.env.IDM_URL!,
  {
    application: 'my-app',
    token: req.headers.authorization,
    tenantId: req.headers['x-tenant-id'],
  }
);

if (!result.valid) {
  return res.status(401).json({ error: result.error });
}
```

## 4. GitHub Actions Workflow

### Mesma Organização (Automático)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read  # ← Permite ler pacotes privados da org
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@idm-auth'
      
      - name: Configure npm for GitHub Packages
        run: |
          echo "@idm-auth:registry=https://npm.pkg.github.com" >> .npmrc
          echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
```

### Organização Diferente (Precisa PAT)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@idm-auth'
      
      - name: Configure npm for GitHub Packages
        run: |
          echo "@idm-auth:registry=https://npm.pkg.github.com" >> .npmrc
          echo "//npm.pkg.github.com/:_authToken=${{ secrets.NPM_TOKEN }}" >> .npmrc
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
```

**Setup do Secret:**
1. Criar PAT no GitHub com scope `read:packages`
2. No repositório consumidor: `Settings → Secrets → Actions → New secret`
3. Nome: `NPM_TOKEN`, Valor: seu PAT

## 5. Desenvolvimento Local

### Com Personal Access Token

Criar `.npmrc` local (não commitar):

```
@idm-auth:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_seu_token_aqui
```

Adicionar ao `.gitignore`:
```
.npmrc
```

### Ou Login Manual

```bash
npm login --registry=https://npm.pkg.github.com
# Username: seu-github-username
# Password: seu-personal-access-token
# Email: seu-email
```

## Resumo

| Cenário | Autenticação | Configuração |
|---------|-------------|--------------|
| **Dev Local** | PAT no `.npmrc` ou `npm login` | Manual |
| **GitHub Actions (mesma org)** | `GITHUB_TOKEN` automático | `permissions: packages: read` |
| **GitHub Actions (org diferente)** | PAT como secret | `secrets.NPM_TOKEN` |
| **CI/CD externo** | PAT como variável de ambiente | Configurar no CI |

## Troubleshooting

### Erro 401 no npm install

```bash
# Verificar autenticação
npm whoami --registry=https://npm.pkg.github.com

# Re-login
npm login --registry=https://npm.pkg.github.com
```

### Erro no GitHub Actions

Verificar:
- [ ] `permissions: packages: read` está no workflow
- [ ] `.npmrc` está configurado antes do `npm ci`
- [ ] Pacote está na mesma organização OU tem PAT configurado
- [ ] Scope `@idm-auth` está correto
