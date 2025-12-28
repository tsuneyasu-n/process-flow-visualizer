import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import {
  ProcessNode,
  ProcessEdge,
  FlowData,
  NodeType,
  AnalysisResult,
  FlowVersion,
  SimulationResult,
  Comment,
  NODE_TYPE_CONFIG,
} from '@/types/flow';

interface FlowState {
  // 現在のフローデータ
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  flowName: string;
  flowDescription: string;

  // 保存済みフロー一覧
  savedFlows: FlowData[];

  // バージョン履歴
  versions: FlowVersion[];

  // 選択中のノード
  selectedNodeId: string | null;

  // AI分析結果
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;

  // シミュレーション
  simulationResult: SimulationResult | null;
  defaultHourlyRate: number;
  defaultAnnualFrequency: number;

  // アクション
  onNodesChange: (changes: NodeChange<ProcessNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ProcessEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<ProcessNode['data']>) => void;
  deleteNode: (nodeId: string) => void;

  setSelectedNode: (nodeId: string | null) => void;

  setFlowName: (name: string) => void;
  setFlowDescription: (description: string) => void;

  saveFlow: () => void;
  loadFlow: (flowId: string) => void;
  deleteFlow: (flowId: string) => void;
  newFlow: () => void;

  exportFlow: () => string;
  importFlow: (json: string) => void;

  setAnalysisResult: (result: AnalysisResult | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;

  // バージョン管理
  saveVersion: (comment?: string) => void;
  loadVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;

  // コメント機能
  addComment: (nodeId: string, author: string, text: string) => void;
  deleteComment: (nodeId: string, commentId: string) => void;

  // シミュレーション
  calculateSimulation: () => SimulationResult;
  setDefaultHourlyRate: (rate: number) => void;
  setDefaultAnnualFrequency: (frequency: number) => void;

  // AI フロー生成用
  setNodes: (nodes: ProcessNode[]) => void;
  setEdges: (edges: ProcessEdge[]) => void;
}

const initialNodes: ProcessNode[] = [];
const initialEdges: ProcessEdge[] = [];

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: initialEdges,
      flowName: '新規フロー',
      flowDescription: '',
      savedFlows: [],
      versions: [],
      selectedNodeId: null,
      analysisResult: null,
      isAnalyzing: false,
      simulationResult: null,
      defaultHourlyRate: 3000,
      defaultAnnualFrequency: 250,

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection) => {
        set({
          edges: addEdge(
            {
              ...connection,
              id: uuidv4(),
              type: 'smoothstep',
              animated: true,
            },
            get().edges
          ),
        });
      },

      addNode: (type, position) => {
        const config = NODE_TYPE_CONFIG[type];
        const newNode: ProcessNode = {
          id: uuidv4(),
          type: 'processNode',
          position,
          data: {
            label: config.label,
            nodeType: type,
            assignee: '',
            duration: ['task', 'userTask', 'serviceTask', 'scriptTask'].includes(type) ? 30 :
                      type === 'wait' ? 60 : undefined,
            description: '',
            issues: [],
            comments: [],
            simulation: {
              currentDuration: ['task', 'userTask', 'serviceTask', 'scriptTask'].includes(type) ? 30 :
                              type === 'wait' ? 60 : 0,
              improvementType: 'none',
            },
          },
        };
        set({
          nodes: [...get().nodes, newNode],
          selectedNodeId: newNode.id,
        });
      },

      updateNodeData: (nodeId, data) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
        });
      },

      deleteNode: (nodeId) => {
        set({
          nodes: get().nodes.filter((node) => node.id !== nodeId),
          edges: get().edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
        });
      },

      setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      setFlowName: (name) => {
        set({ flowName: name });
      },

      setFlowDescription: (description) => {
        set({ flowDescription: description });
      },

      saveFlow: () => {
        const { nodes, edges, flowName, flowDescription, savedFlows, versions } = get();
        const now = new Date().toISOString();

        const existingIndex = savedFlows.findIndex(
          (flow) => flow.name === flowName
        );

        const newFlow: FlowData = {
          id: existingIndex >= 0 ? savedFlows[existingIndex].id : uuidv4(),
          name: flowName,
          description: flowDescription,
          nodes,
          edges,
          versions,
          createdAt: existingIndex >= 0 ? savedFlows[existingIndex].createdAt : now,
          updatedAt: now,
        };

        if (existingIndex >= 0) {
          const updatedFlows = [...savedFlows];
          updatedFlows[existingIndex] = newFlow;
          set({ savedFlows: updatedFlows });
        } else {
          set({ savedFlows: [...savedFlows, newFlow] });
        }
      },

      loadFlow: (flowId) => {
        const flow = get().savedFlows.find((f) => f.id === flowId);
        if (flow) {
          set({
            nodes: flow.nodes,
            edges: flow.edges,
            flowName: flow.name,
            flowDescription: flow.description || '',
            versions: flow.versions || [],
            selectedNodeId: null,
            analysisResult: null,
          });
        }
      },

      deleteFlow: (flowId) => {
        set({
          savedFlows: get().savedFlows.filter((flow) => flow.id !== flowId),
        });
      },

      newFlow: () => {
        set({
          nodes: [],
          edges: [],
          flowName: '新規フロー',
          flowDescription: '',
          versions: [],
          selectedNodeId: null,
          analysisResult: null,
          simulationResult: null,
        });
      },

      exportFlow: () => {
        const { nodes, edges, flowName, flowDescription, versions } = get();
        const flow: FlowData = {
          id: uuidv4(),
          name: flowName,
          description: flowDescription,
          nodes,
          edges,
          versions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return JSON.stringify(flow, null, 2);
      },

      importFlow: (json) => {
        try {
          const flow: FlowData = JSON.parse(json);
          set({
            nodes: flow.nodes,
            edges: flow.edges,
            flowName: flow.name,
            flowDescription: flow.description || '',
            versions: flow.versions || [],
            selectedNodeId: null,
            analysisResult: null,
          });
        } catch (error) {
          console.error('Invalid JSON:', error);
          throw new Error('JSONの形式が正しくありません');
        }
      },

      setAnalysisResult: (result) => {
        set({ analysisResult: result });
      },

      setIsAnalyzing: (isAnalyzing) => {
        set({ isAnalyzing });
      },

      // バージョン管理
      saveVersion: (comment) => {
        const { nodes, edges, flowName, flowDescription, versions } = get();
        const newVersion: FlowVersion = {
          id: uuidv4(),
          name: flowName,
          description: flowDescription,
          nodes: JSON.parse(JSON.stringify(nodes)), // deep copy
          edges: JSON.parse(JSON.stringify(edges)),
          savedAt: new Date().toISOString(),
          comment,
        };
        set({ versions: [...versions, newVersion] });
      },

      loadVersion: (versionId) => {
        const version = get().versions.find((v) => v.id === versionId);
        if (version) {
          set({
            nodes: JSON.parse(JSON.stringify(version.nodes)),
            edges: JSON.parse(JSON.stringify(version.edges)),
            selectedNodeId: null,
            analysisResult: null,
          });
        }
      },

      deleteVersion: (versionId) => {
        set({
          versions: get().versions.filter((v) => v.id !== versionId),
        });
      },

      // コメント機能
      addComment: (nodeId, author, text) => {
        const newComment: Comment = {
          id: uuidv4(),
          author,
          text,
          createdAt: new Date().toISOString(),
        };
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    comments: [...(node.data.comments || []), newComment],
                  },
                }
              : node
          ),
        });
      },

      deleteComment: (nodeId, commentId) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    comments: (node.data.comments || []).filter(
                      (c) => c.id !== commentId
                    ),
                  },
                }
              : node
          ),
        });
      },

      // シミュレーション計算
      calculateSimulation: () => {
        const { nodes, defaultHourlyRate, defaultAnnualFrequency } = get();

        let currentTotalMinutes = 0;
        let improvedTotalMinutes = 0;

        nodes.forEach((node) => {
          const sim = node.data.simulation;
          const duration = (node.data.duration as number) || 0;
          const currentDuration = sim?.currentDuration || duration;

          currentTotalMinutes += currentDuration;

          if (sim?.improvementType === 'eliminate') {
            // 削除: 0分
            improvedTotalMinutes += 0;
          } else if (sim?.improvedDuration !== undefined) {
            improvedTotalMinutes += sim.improvedDuration;
          } else {
            improvedTotalMinutes += currentDuration;
          }
        });

        const hourlyRate = defaultHourlyRate;
        const annualFrequency = defaultAnnualFrequency;

        const currentAnnualHours = (currentTotalMinutes / 60) * annualFrequency;
        const improvedAnnualHours = (improvedTotalMinutes / 60) * annualFrequency;
        const savedAnnualHours = currentAnnualHours - improvedAnnualHours;

        const currentAnnualCost = currentAnnualHours * hourlyRate;
        const improvedAnnualCost = improvedAnnualHours * hourlyRate;
        const savedAnnualCost = currentAnnualCost - improvedAnnualCost;

        const result: SimulationResult = {
          currentTotal: {
            duration: currentTotalMinutes,
            annualHours: currentAnnualHours,
            annualCost: currentAnnualCost,
          },
          improvedTotal: {
            duration: improvedTotalMinutes,
            annualHours: improvedAnnualHours,
            annualCost: improvedAnnualCost,
          },
          savings: {
            duration: currentTotalMinutes - improvedTotalMinutes,
            annualHours: savedAnnualHours,
            annualCost: savedAnnualCost,
            threeYearCost: savedAnnualCost * 3,
          },
        };

        set({ simulationResult: result });
        return result;
      },

      setDefaultHourlyRate: (rate) => {
        set({ defaultHourlyRate: rate });
      },

      setDefaultAnnualFrequency: (frequency) => {
        set({ defaultAnnualFrequency: frequency });
      },

      // AI フロー生成用
      setNodes: (nodes) => {
        set({ nodes });
      },

      setEdges: (edges) => {
        set({ edges });
      },
    }),
    {
      name: 'process-flow-storage',
      partialize: (state) => ({
        savedFlows: state.savedFlows,
        defaultHourlyRate: state.defaultHourlyRate,
        defaultAnnualFrequency: state.defaultAnnualFrequency,
      }),
    }
  )
);
