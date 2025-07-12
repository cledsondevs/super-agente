const GeminiService = require('./gemini');
const MemoryService = require('./memory');

class WorkflowExecutor {
  constructor() {
    this.gemini = new GeminiService();
    this.memory = new MemoryService();
  }

  async executeWorkflow(workflow) {
    try {
      const { nodes, edges } = workflow.definition;
      const results = {};
      
      // Ordenar nós por dependências (implementação simplificada)
      const sortedNodes = this.topologicalSort(nodes, edges);
      
      for (const node of sortedNodes) {
        const result = await this.executeNode(node, results);
        results[node.id] = result;
      }

      return {
        status: 'success',
        results,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na execução do workflow:', error);
      return {
        status: 'error',
        error: error.message,
        executedAt: new Date().toISOString()
      };
    }
  }

  async executeNode(node, previousResults) {
    try {
      switch (node.type) {
        case 'inputNode':
          return {
            type: 'input',
            value: node.data.value || '',
            status: 'completed'
          };

        case 'geminiNode':
          return await this.executeGeminiNode(node, previousResults);

        case 'outputNode':
          return await this.executeOutputNode(node, previousResults);

        default:
          throw new Error(`Tipo de nó não suportado: ${node.type}`);
      }
    } catch (error) {
      return {
        type: node.type,
        status: 'error',
        error: error.message
      };
    }
  }

  async executeGeminiNode(node, previousResults) {
    try {
      const instruction = node.data.instruction || '';
      
      // Obter entrada dos nós anteriores
      const inputValue = this.getInputForNode(node, previousResults);
      
      // Buscar contexto relevante na memória
      const context = await this.memory.getRelevantContext(instruction);
      
      // Construir prompt completo
      const fullPrompt = `${instruction}\n\nEntrada: ${inputValue}`;
      
      // Gerar resposta com Gemini
      const response = await this.gemini.generateResponse(fullPrompt, context);
      
      // Armazenar interação na memória
      await this.memory.storeMemory(
        `Instrução: ${instruction}\nEntrada: ${inputValue}\nResposta: ${response}`,
        {
          type: 'gemini_interaction',
          node_id: node.id,
          instruction,
          input: inputValue
        }
      );

      return {
        type: 'gemini',
        instruction,
        input: inputValue,
        output: response,
        status: 'completed'
      };
    } catch (error) {
      throw new Error(`Erro no nó Gemini: ${error.message}`);
    }
  }

  async executeOutputNode(node, previousResults) {
    try {
      // Obter resultado dos nós anteriores
      const inputValue = this.getInputForNode(node, previousResults);
      
      return {
        type: 'output',
        value: inputValue,
        status: 'completed'
      };
    } catch (error) {
      throw new Error(`Erro no nó de saída: ${error.message}`);
    }
  }

  getInputForNode(node, previousResults) {
    // Implementação simplificada - pega o primeiro resultado disponível
    const resultValues = Object.values(previousResults);
    
    if (resultValues.length === 0) {
      return '';
    }

    const lastResult = resultValues[resultValues.length - 1];
    
    if (lastResult.type === 'input') {
      return lastResult.value;
    } else if (lastResult.type === 'gemini') {
      return lastResult.output;
    } else if (lastResult.type === 'output') {
      return lastResult.value;
    }

    return '';
  }

  topologicalSort(nodes, edges) {
    // Implementação simplificada de ordenação topológica
    // Em produção, implemente um algoritmo mais robusto
    
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const inDegree = new Map();
    const adjList = new Map();

    // Inicializar
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });

    // Construir grafo
    edges.forEach(edge => {
      adjList.get(edge.source).push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target) + 1);
    });

    // Ordenação topológica
    const queue = [];
    const result = [];

    // Adicionar nós sem dependências
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift();
      result.push(nodeMap.get(nodeId));

      adjList.get(nodeId).forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  }
}

module.exports = WorkflowExecutor;

