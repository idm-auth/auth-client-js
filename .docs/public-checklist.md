# Checklist: Tornar Projeto Público

## ✅ Segurança (Já Verificado)
- [x] Sem credenciais no código
- [x] Sem tokens ou secrets
- [x] `.env` no .gitignore
- [x] Sem dados sensíveis

## 📝 Antes de Publicar

### 1. Atualizar package.json
- [ ] Atualizar `repository.url` com URL real do GitHub
- [ ] Atualizar `bugs.url` com URL real
- [ ] Atualizar `homepage` com URL real
- [ ] Verificar `author` (já configurado como "IDM Auth Team")

### 2. Verificar Arquivos
- [x] LICENSE criado (ISC)
- [x] README.md completo
- [x] .gitignore configurado
- [x] .npmignore configurado

### 3. Limpar Histórico Git (Opcional)
Se o repositório privado tem commits com dados sensíveis:

```bash
# Criar novo repositório limpo
git checkout --orphan main-clean
git add -A
git commit -m "Initial public release"
git branch -D main
git branch -m main
git push -f origin main
```

### 4. GitHub Repository Settings
- [ ] Criar repositório público no GitHub
- [ ] Adicionar descrição: "Backend-agnostic HTTP client for IDM authentication and authorization"
- [ ] Adicionar topics: `authentication`, `authorization`, `jwt`, `iam`, `typescript`, `http-client`
- [ ] Configurar branch protection (opcional)

### 5. Publicar no NPM
```bash
# Login no NPM
npm login

# Build
npm run build

# Testar pacote
npm pack --dry-run

# Publicar
npm publish --access public
```

### 6. Documentação Adicional (Opcional)
- [ ] Adicionar CONTRIBUTING.md
- [ ] Adicionar CODE_OF_CONDUCT.md
- [ ] Adicionar badges no README (build status, npm version, license)
- [ ] Configurar GitHub Actions para CI/CD

## 🚀 Após Publicar

### 1. Verificar Instalação
```bash
npm install @idm-auth/client
```

### 2. Testar em Projeto Novo
```bash
mkdir test-install
cd test-install
npm init -y
npm install @idm-auth/client
```

### 3. Anunciar
- [ ] Atualizar projetos internos para usar versão pública
- [ ] Documentar migração (se necessário)

## ⚠️ Importante

### O que NÃO incluir:
- ❌ Credenciais ou tokens
- ❌ URLs de produção específicas
- ❌ Dados de clientes
- ❌ Lógica de negócio proprietária
- ❌ Configurações internas

### O que PODE incluir:
- ✅ Interface HTTP genérica
- ✅ Tipos TypeScript
- ✅ Exemplos de uso
- ✅ Documentação de arquitetura
- ✅ Testes unitários

## 📊 Benefícios de Tornar Público

1. **Comunidade**: Outros podem contribuir
2. **Transparência**: Código auditável
3. **Portfólio**: Demonstra expertise
4. **Feedback**: Melhorias da comunidade
5. **Adoção**: Mais fácil de usar em projetos

## 🔒 Se Mudar de Ideia

Para tornar privado novamente:
1. GitHub: Settings → Danger Zone → Change visibility → Make private
2. NPM: `npm unpublish @idm-auth/client` (apenas primeiras 72h)
