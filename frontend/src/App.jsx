import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Play, Save, Plus, Trash2, Settings } from 'lucide-react';
import axios from 'axios';
import './App.css';

// URL da API - usar localhost para desenvolvimento, Vercel para produção
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : 'https://super-agente.vercel.app';

// Tipos de nós personalizados
const nodeTypes = {
  geminiNode: ({ data }) => (
    <Card className="w-64 border-2 border-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          Gemini AI
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600 mb-2">Instrução:</div>
        <div className="text-sm bg-gray-50 p-2 rounded text-wrap break-words">
          {data.instruction || 'Digite uma instrução...'}
        </div>
        {data.output && (
          <>
            <div className="text-xs text-gray-600 mb-2 mt-3">Resultado:</div>
            <div className="text-sm bg-blue-50 p-2 rounded text-wrap break-words border border-blue-200">
              {data.output}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  ),
  inputNode: ({ data }) => (
    <Card className="w-64 border-2 border-green-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          Entrada
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600 mb-2">Valor:</div>
        <div className="text-sm bg-gray-50 p-2 rounded text-wrap break-words">
          {data.value || 'Valor de entrada...'}
        </div>
      </CardContent>
    </Card>
  ),
  outputNode: ({ data }) => (
    <Card className="w-64 border-2 border-purple-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          Saída
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600 mb-2">Resultado:</div>
        <div className="text-sm bg-gray-50 p-2 rounded text-wrap break-words">
          {data.result || 'Aguardando execução...'}
        </div>
      </CardContent>
    </Card>
  ),
};

const initialNodes = [
  {
    id: '1',
    type: 'inputNode',
    position: { x: 100, y: 100 },
    data: { value: 'Olá, mundo!' },
  },
  {
    id: '2',
    type: 'geminiNode',
    position: { x: 400, y: 100 },
    data: { instruction: 'Traduza o texto de entrada para inglês' },
  },
  {
    id: '3',
    type: 'outputNode',
    position: { x: 700, y: 100 },
    data: { result: '' },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('Meu Workflow');
  const [selectedNode, setSelectedNode] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [executionResults, setExecutionResults] = useState({});
  const reactFlowWrapper = useRef(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const addNode = (type) => {
    const newNode = {
      id: `${Date.now()}`, // Usar timestamp para IDs únicos
      type: type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: type === 'geminiNode' 
        ? { instruction: '' }
        : type === 'inputNode' 
        ? { value: '' }
        : { result: '' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  };

  const saveWorkflow = async () => {
    setIsSaving(true);
    try {
      const workflowData = {
        name: workflowName,
        definition: {
          nodes: nodes,
          edges: edges,
        },
      };

      // Simular salvamento por enquanto
      console.log('Salvando workflow:', workflowData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Workflow salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
      alert('Erro ao salvar workflow: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setExecutionResults({});
    
    try {
      console.log('Executando workflow...');
      
      // Limpar resultados anteriores
      setNodes((nds) => nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          output: undefined,
          result: node.type === 'outputNode' ? 'Executando...' : node.data.result
        }
      })));

      // Executar nós em sequência baseado nas conexões
      const sortedNodes = topologicalSort(nodes, edges);
      let results = {};

      for (const node of sortedNodes) {
        console.log(`Executando nó ${node.id} (${node.type})`);
        
        if (node.type === 'inputNode') {
          results[node.id] = {
            type: 'input',
            value: node.data.value || '',
            status: 'completed'
          };
        } else if (node.type === 'geminiNode') {
          // Obter entrada dos nós anteriores
          const inputValue = getInputForNode(node, results, edges);
          const instruction = node.data.instruction || '';
          
          try {
            // Simular resposta do Gemini por enquanto
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            let output;
            if (instruction.toLowerCase().includes('traduz')) {
              output = 'Hello, world!';
            } else if (instruction.toLowerCase().includes('resumo')) {
              output = 'Este é um resumo gerado pelo Gemini AI sobre o conteúdo fornecido.';
            } else if (instruction.toLowerCase().includes('análise')) {
              output = 'Análise: O conteúdo apresenta características positivas e pode ser melhorado em alguns aspectos.';
            } else {
              output = `Resposta processada para: "${inputValue}"`;
            }
            
            // Atualizar nó com resultado
            updateNodeData(node.id, { output });
            
            results[node.id] = {
              type: 'gemini',
              instruction,
              input: inputValue,
              output,
              status: 'completed'
            };
          } catch (error) {
            console.error('Erro ao executar nó Gemini:', error);
            const errorMsg = 'Erro ao processar com IA';
            updateNodeData(node.id, { output: errorMsg });
            results[node.id] = {
              type: 'gemini',
              status: 'error',
              error: errorMsg
            };
          }
        } else if (node.type === 'outputNode') {
          const inputValue = getInputForNode(node, results, edges);
          updateNodeData(node.id, { result: inputValue });
          
          results[node.id] = {
            type: 'output',
            value: inputValue,
            status: 'completed'
          };
        }
        
        // Pequeno delay para visualização
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setExecutionResults(results);
      console.log('Workflow executado com sucesso!', results);
      
    } catch (error) {
      console.error('Erro ao executar workflow:', error);
      alert('Erro ao executar workflow: ' + error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Função para ordenação topológica
  const topologicalSort = (nodes, edges) => {
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
  };

  // Função para obter entrada de um nó
  const getInputForNode = (node, results, edges) => {
    // Encontrar nós que se conectam a este nó
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    
    if (incomingEdges.length === 0) {
      return '';
    }

    // Pegar resultado do primeiro nó conectado
    const sourceNodeId = incomingEdges[0].source;
    const sourceResult = results[sourceNodeId];

    if (!sourceResult) {
      return '';
    }

    if (sourceResult.type === 'input') {
      return sourceResult.value;
    } else if (sourceResult.type === 'gemini') {
      return sourceResult.output;
    } else if (sourceResult.type === 'output') {
      return sourceResult.value;
    }

    return '';
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Super Agente</h1>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-64"
            placeholder="Nome do workflow"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={saveWorkflow}
            disabled={isSaving}
            variant="outline"
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            onClick={executeWorkflow}
            disabled={isExecuting}
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            {isExecuting ? 'Executando...' : 'Executar'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r p-4">
          <h3 className="font-semibold mb-4">Adicionar Nós</h3>
          <div className="space-y-2">
            <Button
              onClick={() => addNode('inputNode')}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Entrada
            </Button>
            <Button
              onClick={() => addNode('geminiNode')}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Gemini AI
            </Button>
            <Button
              onClick={() => addNode('outputNode')}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Saída
            </Button>
          </div>

          {/* Propriedades do nó selecionado */}
          {selectedNode && (
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Propriedades</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {selectedNode.type === 'inputNode' && 'Entrada'}
                    {selectedNode.type === 'geminiNode' && 'Gemini AI'}
                    {selectedNode.type === 'outputNode' && 'Saída'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedNode.type === 'inputNode' && (
                    <div>
                      <label className="text-xs text-gray-600">Valor:</label>
                      <Textarea
                        value={selectedNode.data.value || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                        placeholder="Valor de entrada..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  )}
                  {selectedNode.type === 'geminiNode' && (
                    <div>
                      <label className="text-xs text-gray-600">Instrução:</label>
                      <Textarea
                        value={selectedNode.data.instruction || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { instruction: e.target.value })}
                        placeholder="Digite uma instrução para o Gemini AI..."
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                  )}
                  <Button
                    onClick={() => deleteNode(selectedNode.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Nó
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="top-center">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm text-gray-600">
                Arraste para conectar os nós
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default App;

