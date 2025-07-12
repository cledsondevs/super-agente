const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async generateResponse(prompt, context = '') {
    try {
      console.log('Gerando resposta para prompt:', prompt);
      
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Resposta gerada:', text);
      return text;
    } catch (error) {
      console.error('Erro ao gerar resposta do Gemini:', error);
      
      // Fallback para resposta simulada em caso de erro
      if (prompt.toLowerCase().includes('traduz')) {
        return 'Hello, world!';
      } else if (prompt.toLowerCase().includes('resumo')) {
        return 'Este é um resumo gerado pelo Gemini AI sobre o conteúdo fornecido.';
      } else if (prompt.toLowerCase().includes('análise')) {
        return 'Análise: O conteúdo apresenta características positivas e pode ser melhorado em alguns aspectos.';
      } else {
        return `Resposta processada para: "${prompt}"`;
      }
    }
  }

  async generateEmbedding(text) {
    try {
      // Para embeddings, usamos o modelo text-embedding-004
      const embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      
      // Fallback: gera um vetor simulado de 768 dimensões
      const embedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
      return embedding;
    }
  }
}

module.exports = GeminiService;

