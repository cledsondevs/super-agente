const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const GeminiService = require('./gemini');
const MemoryService = require('./memory');
const WorkflowExecutor = require('./workflow-executor');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Inicializar serviços
const geminiService = new GeminiService();
const memoryService = new MemoryService(supabase);
const workflowExecutor = new WorkflowExecutor(geminiService, memoryService);

// Rota principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'Super Agente API',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rota para listar workflows
app.get('/api/workflows', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar workflows:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar um novo workflow
app.post('/api/workflows', async (req, res) => {
  try {
    const { name, definition, user_id } = req.body;

    if (!name || !definition) {
      return res.status(400).json({ error: 'Nome e definição são obrigatórios' });
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert([
        {
          name,
          definition,
          user_id: user_id || null
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro ao criar workflow:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar um workflow específico
app.get('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Workflow não encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar workflow:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar um workflow
app.put('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, definition } = req.body;

    const { data, error } = await supabase
      .from('workflows')
      .update({ name, definition })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Workflow não encontrado' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Erro ao atualizar workflow:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar um workflow
app.delete('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Workflow deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar workflow:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para executar um workflow
app.post('/api/workflows/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (workflowError) throw workflowError;

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow não encontrado' });
    }

    // Executar o workflow
    const executionResult = await workflowExecutor.executeWorkflow(workflow);

    // Salvar log de execução
    const { error: logError } = await supabase
      .from('execution_logs')
      .insert([
        {
          workflow_id: id,
          status: executionResult.status,
          output: executionResult
        }
      ]);

    if (logError) {
      console.error('Erro ao salvar log:', logError);
    }

    res.json(executionResult);
  } catch (error) {
    console.error('Erro ao executar workflow:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar logs de execução
app.get('/api/workflows/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('execution_logs')
      .select('*')
      .eq('workflow_id', id)
      .order('executed_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas para memória
app.post('/api/memory', async (req, res) => {
  try {
    const { content, metadata } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório' });
    }

    const result = await memoryService.storeMemory(content, metadata);
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao armazenar memória:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/memory/search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    const results = await memoryService.searchMemory(query, parseInt(limit));
    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar na memória:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota específica para geração com Gemini AI
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, input } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    console.log('Recebida solicitação Gemini:', { prompt, input });

    // Construir prompt completo
    let fullPrompt = prompt;
    if (input) {
      fullPrompt = `${prompt}\n\nTexto de entrada: ${input}`;
    }

    console.log('Prompt completo:', fullPrompt);

    // Gerar resposta usando o Gemini
    const response = await geminiService.generateResponse(fullPrompt);

    console.log('Resposta do Gemini:', response);

    res.json({ 
      prompt: fullPrompt,
      response,
      input,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao gerar resposta com Gemini:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      fallback: true
    });
  }
});

// Rota de teste para Gemini
app.post('/api/gemini/test', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    const response = await geminiService.generateResponse(prompt);

    res.json({ prompt, response });
  } catch (error) {
    console.error('Erro ao testar Gemini:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!supabaseUrl && !!supabaseKey,
      gemini: !!process.env.GEMINI_API_KEY
    }
  });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Acesse: http://localhost:${port}`);
  console.log('Variáveis de ambiente:');
  console.log('- SUPABASE_URL:', !!supabaseUrl);
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  console.log('- GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY);
});

module.exports = app;

