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
      id: `${nodes.length + 1}`,
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

      // Aqui você conectaria com sua API
      console.log('Salvando workflow:', workflowData);
      
      // Simulação de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Workflow salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
      alert('Erro ao salvar workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    try {
      // Simulação de execução
      console.log('Executando workflow...');
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar resultado do nó de saída
      const outputNode = nodes.find(node => node.type === 'outputNode');
      if (outputNode) {
        updateNodeData(outputNode.id, { result: 'Hello, world!' });
      }
      
      alert('Workflow executado com sucesso!');
    } catch (error) {
      console.error('Erro ao executar workflow:', error);
      alert('Erro ao executar workflow');
    } finally {
      setIsExecuting(false);
    }
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {selectedNode.type === 'geminiNode' ? 'Gemini AI' :
                     selectedNode.type === 'inputNode' ? 'Entrada' : 'Saída'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedNode.type === 'geminiNode' && (
                    <div>
                      <label className="text-xs text-gray-600">Instrução:</label>
                      <Textarea
                        value={selectedNode.data.instruction || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { instruction: e.target.value })}
                        placeholder="Digite a instrução para o Gemini..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  )}
                  {selectedNode.type === 'inputNode' && (
                    <div>
                      <label className="text-xs text-gray-600">Valor:</label>
                      <Input
                        value={selectedNode.data.value || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                        placeholder="Valor de entrada..."
                        className="mt-1"
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

        {/* Canvas principal */}
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
            <Panel position="top-left">
              <div className="bg-white p-2 rounded shadow text-sm">
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

