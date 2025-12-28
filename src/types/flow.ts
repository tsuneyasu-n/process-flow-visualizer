import { Node, Edge } from '@xyflow/react';

// BPMN準拠ノードタイプ
export type NodeType =
  // イベント
  | 'start'
  | 'end'
  | 'intermediate'
  // タスク
  | 'task'
  | 'userTask'
  | 'serviceTask'
  | 'scriptTask'
  // ゲートウェイ
  | 'exclusiveGateway'  // XOR - 排他
  | 'parallelGateway'   // AND - 並列
  | 'inclusiveGateway'  // OR - 包含
  // その他
  | 'wait'
  | 'subprocess';

// コメント
export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

// シミュレーション用データ
export interface SimulationData {
  currentDuration: number;      // 現状の時間（分）
  improvedDuration?: number;    // 改善後の時間（分）
  hourlyRate?: number;          // 時給（円）
  annualFrequency?: number;     // 年間実行回数
  improvementType?: 'automate' | 'eliminate' | 'parallelize' | 'optimize' | 'none';
}

// ノードデータ
export interface ProcessNodeData {
  [key: string]: unknown;
  label: string;
  nodeType: NodeType;
  assignee?: string;
  department?: string;          // 部署（レーン用）
  duration?: number;            // 所要時間（分）
  description?: string;
  issues?: string[];
  comments?: Comment[];         // コメント機能
  simulation?: SimulationData;  // シミュレーション用
}

// React Flowのノード型
export type ProcessNode = Node<ProcessNodeData>;

// React Flowのエッジ型
export type ProcessEdge = Edge<{ label?: string }>;

// バージョン履歴
export interface FlowVersion {
  id: string;
  name: string;
  description?: string;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  savedAt: string;
  comment?: string;  // バージョンコメント
}

// フローデータ全体
export interface FlowData {
  id: string;
  name: string;
  description?: string;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  versions?: FlowVersion[];     // バージョン履歴
  createdAt: string;
  updatedAt: string;
}

// AI分析結果
export interface AnalysisResult {
  summary: string;
  totalDuration: number;
  bottlenecks: {
    nodeId: string;
    nodeName: string;
    reason: string;
    suggestion: string;
  }[];
  improvements: {
    category: '自動化' | '統合' | '削除' | '並列化' | 'その他';
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
}

// シミュレーション結果
export interface SimulationResult {
  currentTotal: {
    duration: number;       // 総時間（分）
    annualHours: number;    // 年間時間（時間）
    annualCost: number;     // 年間コスト（円）
  };
  improvedTotal: {
    duration: number;
    annualHours: number;
    annualCost: number;
  };
  savings: {
    duration: number;       // 削減時間（分）
    annualHours: number;    // 年間削減時間（時間）
    annualCost: number;     // 年間削減コスト（円）
    threeYearCost: number;  // 3年間削減コスト（円）
  };
  roi?: number;             // 投資対効果（%）
}

// ノードタイプの設定
export const NODE_TYPE_CONFIG: Record<NodeType, {
  label: string;
  labelEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'rounded';
  category: 'event' | 'task' | 'gateway' | 'other';
}> = {
  // イベント
  start: {
    label: '開始イベント',
    labelEn: 'Start',
    color: '#22c55e',
    bgColor: '#dcfce7',
    borderColor: '#22c55e',
    shape: 'circle',
    category: 'event',
  },
  end: {
    label: '終了イベント',
    labelEn: 'End',
    color: '#ef4444',
    bgColor: '#fee2e2',
    borderColor: '#ef4444',
    shape: 'circle',
    category: 'event',
  },
  intermediate: {
    label: '中間イベント',
    labelEn: 'Intermediate',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    shape: 'circle',
    category: 'event',
  },
  // タスク
  task: {
    label: 'タスク',
    labelEn: 'Task',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    borderColor: '#3b82f6',
    shape: 'rounded',
    category: 'task',
  },
  userTask: {
    label: 'ユーザータスク',
    labelEn: 'User Task',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    borderColor: '#8b5cf6',
    shape: 'rounded',
    category: 'task',
  },
  serviceTask: {
    label: 'サービスタスク',
    labelEn: 'Service Task',
    color: '#06b6d4',
    bgColor: '#cffafe',
    borderColor: '#06b6d4',
    shape: 'rounded',
    category: 'task',
  },
  scriptTask: {
    label: 'スクリプトタスク',
    labelEn: 'Script Task',
    color: '#14b8a6',
    bgColor: '#ccfbf1',
    borderColor: '#14b8a6',
    shape: 'rounded',
    category: 'task',
  },
  // ゲートウェイ
  exclusiveGateway: {
    label: '排他ゲートウェイ',
    labelEn: 'XOR Gateway',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    shape: 'diamond',
    category: 'gateway',
  },
  parallelGateway: {
    label: '並列ゲートウェイ',
    labelEn: 'AND Gateway',
    color: '#10b981',
    bgColor: '#d1fae5',
    borderColor: '#10b981',
    shape: 'diamond',
    category: 'gateway',
  },
  inclusiveGateway: {
    label: '包含ゲートウェイ',
    labelEn: 'OR Gateway',
    color: '#6366f1',
    bgColor: '#e0e7ff',
    borderColor: '#6366f1',
    shape: 'diamond',
    category: 'gateway',
  },
  // その他
  wait: {
    label: '待機',
    labelEn: 'Wait',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#6b7280',
    shape: 'rounded',
    category: 'other',
  },
  subprocess: {
    label: 'サブプロセス',
    labelEn: 'Subprocess',
    color: '#ec4899',
    bgColor: '#fce7f3',
    borderColor: '#ec4899',
    shape: 'rounded',
    category: 'other',
  },
};

// 改善タイプの設定
export const IMPROVEMENT_TYPES = {
  automate: { label: '自動化', description: 'RPAやシステム化により自動化' },
  eliminate: { label: '削除', description: '不要なステップを削除' },
  parallelize: { label: '並列化', description: '同時実行可能な作業を並列化' },
  optimize: { label: '最適化', description: 'プロセスを効率化' },
  none: { label: '変更なし', description: '現状維持' },
} as const;
