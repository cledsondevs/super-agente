# Super Agente

Um agente de automação visual similar ao n8n, construído com React Flow, Gemini AI e Supabase.

## 🚀 Características

- **Interface Drag-and-Drop**: Interface visual intuitiva para criar fluxos de trabalho
- **Integração com Gemini AI**: Processamento de linguagem natural avançado
- **Memória Vetorial**: Sistema de memória persistente usando Supabase e embeddings
- **Execução em Tempo Real**: Visualização do progresso de execução dos fluxos
- **Arquitetura Moderna**: Frontend React + Backend Node.js + Banco Supabase

## 🏗️ Arquitetura

### Frontend (React + React Flow)
- **Hospedado em**: Amazon S3
- **URL**: http://super-agente-frontend-1752290335.s3-website-us-east-1.amazonaws.com
- **Tecnologias**: React, React Flow, Axios, Vite

### Backend (Node.js + Express)
- **Hospedado em**: Vercel
- **Tecnologias**: Express, CORS, Supabase Client, Google Generative AI

### Banco de Dados (Supabase)
- **PostgreSQL** com extensão `pg_vector` para embeddings
- **Tabelas**: users, workflows, execution_logs, memories

## 📦 Estrutura do Projeto

```
super-agente/
├── backend/                 # API Node.js
│   ├── index.js            # Servidor principal
│   ├── gemini.js           # Integração Gemini AI
│   ├── memory.js           # Sistema de memória vetorial
│   ├── workflow-executor.js # Executor de workflows
│   ├── package.json
│   ├── vercel.json         # Configuração Vercel
│   └── .env               # Variáveis de ambiente
├── frontend/               # Interface React
│   ├── src/
│   │   ├── App.jsx        # Componente principal
│   │   └── ...
│   ├── dist/              # Build de produção
│   └── package.json
├── README.md
├── .gitignore
└── todo.md
```

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou pnpm
- Conta no Supabase
- Chave API do Google Gemini

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
pnpm install
pnpm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente (Backend)
```env
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
GEMINI_API_KEY=sua_chave_gemini
```

### Banco de Dados (Supabase)
Execute os seguintes comandos SQL no Supabase:

```sql
-- Habilitar extensão vector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de logs de execução
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id),
  status TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  execution_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de memórias
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🎯 Como Usar

1. **Acesse a interface**: Abra a URL do frontend no navegador
2. **Crie um fluxo**: Arraste nós da barra lateral para o canvas
3. **Configure nós**: Clique nos nós para configurar suas propriedades
4. **Conecte nós**: Arraste das saídas para as entradas para criar conexões
5. **Execute**: Clique em "Executar" para rodar o fluxo
6. **Monitore**: Acompanhe o progresso em tempo real

## 🧩 Tipos de Nós Disponíveis

- **Entrada**: Recebe dados iniciais
- **Gemini AI**: Processa texto com IA
- **Memória**: Salva/recupera informações
- **Saída**: Exibe resultados finais

## 🚀 Deploy

### Frontend (S3)
```bash
cd frontend
pnpm run build
aws s3 sync dist/ s3://seu-bucket --delete
```

### Backend (Vercel)
```bash
cd backend
vercel --prod
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

**Cledson Alves**
- GitHub: [@cledsondevs](https://github.com/cledsondevs)
- Email: cledsondevs@gmail.com

---

Desenvolvido com ❤️ usando React, Node.js, Supabase e Gemini AI.

