# Publishing Guide

## Pré-requisitos

1. Build do projeto funcionando:
```bash
npm run build
```

2. Testes passando:
```bash
npm test
```

3. Versão atualizada no `package.json`

## Opção 1: NPM Público (Recomendado)

### Setup Inicial

1. Criar conta em [npmjs.com](https://www.npmjs.com/signup)

2. Login no terminal:
```bash
npm login
```

3. Verificar login:
```bash
npm whoami
```

### Publicar

```bash
# Build
npm run build

# Publicar (primeira vez ou atualização)
npm publish --access public
```

### Atualizar Versão

```bash
# Patch (0.1.0 -> 0.1.1) - bug fixes
npm version patch

# Minor (0.1.0 -> 0.2.0) - novas features
npm version minor

# Major (0.1.0 -> 1.0.0) - breaking changes
npm version major

# Publicar nova versão
npm publish --access public
```

### Instalar em Outros Projetos

```bash
npm install @idm-auth/client
```

## Opção 2: GitHub Packages (Privado)

### Setup Inicial

1. Criar `.npmrc` no projeto (já existe):
```
@idm-auth:registry=https://npm.pkg.github.com
```

2. Criar Personal Access Token no GitHub:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Scopes: `write:packages`, `read:packages`

3. Login:
```bash
npm login --registry=https://npm.pkg.github.com
# Username: seu-username-github
# Password: seu-personal-access-token
# Email: seu-email
```

### Publicar

```bash
# Build
npm run build

# Publicar
npm publish --registry=https://npm.pkg.github.com
```

### Instalar em Outros Projetos

#### Desenvolvimento Local

1. Criar `.npmrc` no projeto:
```
@idm-auth:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=SEU_PERSONAL_ACCESS_TOKEN
```

2. Instalar:
```bash
npm install @idm-auth/client
```

#### GitHub Actions (Mesma Organização)

**✅ Funciona automaticamente!** GitHub Actions tem acesso aos pacotes privados da organização.

No workflow do outro projeto:

```yaml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read  # ← Necessário!
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@idm-auth'
      
      - name: Configure npm
        run: |
          echo "@idm-auth:registry=https://npm.pkg.github.com" >> .npmrc
          echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc
      
      - run: npm ci
      - run: npm run build
```

**Importante:** O `GITHUB_TOKEN` é automático, não precisa criar secret!

#### GitHub Actions (Organização Diferente)

Precisa criar Personal Access Token:

1. Criar PAT com scope `read:packages`
2. Adicionar como secret no repositório: `Settings → Secrets → Actions → New secret`
3. Nome: `NPM_TOKEN`

```yaml
- name: Configure npm
  run: |
    echo "@idm-auth:registry=https://npm.pkg.github.com" >> .npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.NPM_TOKEN }}" >> .npmrc
```

## CI/CD Automation (GitHub Actions)

Criar `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-github:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Verificar Pacote Antes de Publicar

```bash
# Ver o que será incluído no pacote
npm pack --dry-run

# Criar tarball local para testar
npm pack

# Instalar localmente em outro projeto
npm install /caminho/para/idm-auth-client-0.1.0.tgz
```

## Checklist de Publicação

- [ ] `npm run build` funciona
- [ ] `npm test` passa
- [ ] README.md atualizado
- [ ] Versão atualizada no package.json
- [ ] CHANGELOG.md atualizado (opcional)
- [ ] Git tag criado (se usar CI/CD)
- [ ] Testar instalação local antes de publicar

## Recomendação

**Use NPM Público** se:
- Projeto é open source
- Quer facilitar instalação
- Não tem dados sensíveis

**Use GitHub Packages** se:
- Projeto é privado
- Quer controle de acesso
- Já usa GitHub para tudo
