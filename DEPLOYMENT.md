# 🚀 Instruções para Deploy - Gerenciamento Dinâmico de Templates

## ⚠️ IMPORTANTE: Executar Migration no Supabase

### Opção 1: Via Dashboard Supabase (Recomendado)

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Clique em **+ New Query**
5. Copie e cole o conteúdo do arquivo:
   ```
   supabase/migrations/002_templates_normas.sql
   ```
6. Clique em **Run** (ou Ctrl+Enter)
7. Aguarde a execução

### Opção 2: Via Supabase CLI (se instalado)

```bash
# Instalar CLI (se não tiver)
npm install -g supabase

# Aplicar migration
supabase migration up

# Ou para seu projeto específico
supabase db push --db-url "postgresql://..."
```

---

## 📋 O que foi implementado

### 1. Banco de Dados (Supabase)
- ✅ Tabela `normas` - Gerenciar normas ISO e standards
- ✅ Tabela `templates` - Templates dinâmicos
- ✅ Tabela `template_analises` - Análises vinculadas a templates

### 2. Backend (lib/laudosServiceSupabase.js)
Novas funções adicionadas:
- **Normas**: `listarNormas()`, `criarNorma()`, `atualizarNorma()`, `deletarNorma()`
- **Templates**: `listarTemplates()`, `criarTemplate()`, `obterTemplate()`, `atualizarTemplate()`, `deletarTemplate()`, `clonarTemplate()`
- **Análises**: `adicionarAnaliseTemplate()`, `atualizarAnaliseTemplate()`, `deletarAnaliseTemplate()`, `reordenarAnaliseTemplate()`

### 3. Páginas de Administração

#### `/admin/normas`
- Listar todas as normas
- Buscar/filtrar por código ou descrição
- Criar nova norma
- Editar norma existente
- Deletar norma

#### `/admin/templates`
- Listar templates dinâmicos
- Criar novo template
- Editar template (nome, descrição, cor)
- Deletar template
- Clonar template (duplica com todas as análises)

#### `/admin/templates/[id]/edit`
- Editar informações do template
- Listar análises do template
- Adicionar nova análise
- Editar análise (nome, norma, specification, tipo foto)
- Deletar análise
- Reordenar análises (botões ↑ ↓)

### 4. Integração na Página de Novo Laudo

#### `/app/laudos/novo/page.jsx`
- **Antes**: Usava array TEMPLATES fixo no código
- **Depois**: Busca templates dinâmicos do Supabase
- Carrega análises do template completo
- Novo botão: "+ Criar Novo Template" que leva a `/admin/templates`

---

## ✅ Checklist de Testes

Após executar a migration:

- [ ] Acessar `/admin/normas` e verificar se lista as normas padrão
- [ ] Criar nova norma em `/admin/normas`
- [ ] Editar uma norma existente
- [ ] Deletar uma norma (com confirmação)
- [ ] Acessar `/admin/templates` e ver templates padrão
- [ ] Criar novo template em `/admin/templates`
- [ ] Clicar em "Editar" em um template
- [ ] Adicionar nova análise ao template
- [ ] Reordenar análises (setas ↑ ↓)
- [ ] Editar uma análise
- [ ] Deletar uma análise
- [ ] Clonar um template
- [ ] Acessar "Novo Laudo" (`/laudos/novo`)
- [ ] Verificar se templates dinâmicos aparecem
- [ ] Selecionar template e verificar se análises carregam
- [ ] Clique em "+ Criar Novo Template" deve levar a `/admin/templates`
- [ ] Criar laudo completo com template dinâmico

---

## 🔧 Troubleshooting

### Problema: Templates não aparecem em `/laudos/novo`

**Solução:**
1. Verificar se a migration foi executada com sucesso
2. Verificar console do navegador (F12) para erros
3. Verificar se o Supabase está acessível

### Problema: Erro ao criar norma/template

**Solução:**
1. Verificar se as tabelas foram criadas
2. Verificar RLS (Row Level Security) - pode estar bloqueando
3. Verificar se o usuário está logado

### Problema: Análises não reordenam

**Solução:**
1. Refresh da página
2. Verificar se a função `reordenarAnaliseTemplate` está sendo chamada
3. Verificar console para erros

---

## 🚀 Deploy para Produção

```bash
# 1. Commit das mudanças
git add .
git commit -m "Add dynamic templates and norms management"

# 2. Push para GitHub
git push origin main

# 3. Vercel refaz deploy automaticamente
# (ou manual: vercel --prod)

# 4. Acessar sistema em produção
# https://sua-url.vercel.app
```

---

## 📝 Notas Importantes

1. **RLS**: Por enquanto sem RLS. Se adicionar depois, cuidado com permissões
2. **Validações**: Campos obrigatórios validados no frontend
3. **Cascata**: Ao deletar template, análises são deletadas automaticamente
4. **Cache**: Considerar adicionar localStorage para cache de templates
5. **Backup**: Sempre backup de dados importantes antes de deletar

---

## 💡 Próximos Passos (Futuro)

- [ ] Adicionar RLS (Row Level Security)
- [ ] Multi-empresa (empresa_id)
- [ ] Importar/Exportar templates (JSON)
- [ ] Versionamento de templates
- [ ] Auditoria de mudanças
- [ ] Cache em localStorage
- [ ] Validação mais robusta no servidor

---

**Pronto para deploy! 🎉**
