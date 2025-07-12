const { createClient } = require('@supabase/supabase-js');
const GeminiService = require('./gemini');

class MemoryService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.gemini = new GeminiService();
  }

  async storeMemory(content, metadata = {}) {
    try {
      // Gerar embedding do conteúdo
      const embedding = await this.gemini.generateEmbedding(content);
      
      // Salvar na tabela de memória (vamos criar esta tabela)
      const { data, error } = await this.supabase
        .from('memories')
        .insert([
          {
            content,
            embedding,
            metadata,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      return data[0];
    } catch (error) {
      console.error('Erro ao armazenar memória:', error);
      throw new Error('Falha ao armazenar na memória');
    }
  }

  async searchMemory(query, limit = 5) {
    try {
      // Gerar embedding da consulta
      const queryEmbedding = await this.gemini.generateEmbedding(query);
      
      // Buscar memórias similares usando busca vetorial
      // Nota: Esta é uma implementação simplificada
      // Em produção, use a função de similaridade do pg_vector
      
      const { data, error } = await this.supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Simular cálculo de similaridade
      const results = data.map(memory => ({
        ...memory,
        similarity: Math.random() // Em produção, calcule a similaridade real
      })).sort((a, b) => b.similarity - a.similarity);

      return results;
    } catch (error) {
      console.error('Erro ao buscar na memória:', error);
      throw new Error('Falha ao buscar na memória');
    }
  }

  async getRelevantContext(query, limit = 3) {
    try {
      const memories = await this.searchMemory(query, limit);
      
      // Combinar o conteúdo das memórias mais relevantes
      const context = memories
        .map(memory => memory.content)
        .join('\n\n');

      return context;
    } catch (error) {
      console.error('Erro ao obter contexto:', error);
      return '';
    }
  }
}

module.exports = MemoryService;

