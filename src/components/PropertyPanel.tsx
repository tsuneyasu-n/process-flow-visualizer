'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { NODE_TYPE_CONFIG, IMPROVEMENT_TYPES } from '@/types/flow';
import VersionPanel from './VersionPanel';
import SimulationPanel from './SimulationPanel';

export default function PropertyPanel() {
  const nodes = useFlowStore((state) => state.nodes);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const addComment = useFlowStore((state) => state.addComment);
  const deleteComment = useFlowStore((state) => state.deleteComment);
  const analysisResult = useFlowStore((state) => state.analysisResult);

  const [newComment, setNewComment] = useState('');
  const [showSimulation, setShowSimulation] = useState(true);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  const handleAddComment = () => {
    if (selectedNodeId && newComment.trim()) {
      addComment(selectedNodeId, 'ユーザー', newComment.trim());
      setNewComment('');
    }
  };

  if (!selectedNode) {
    return (
      <div className="bg-white border-l border-gray-200 w-80 flex flex-col">
        <div className="p-4 flex-1">
          <div className="text-gray-500 text-sm">
            ノードを選択すると詳細を編集できます
          </div>
        </div>
        <div className="border-t">
          <button
            onClick={() => setShowSimulation(!showSimulation)}
            className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span>シミュレーション</span>
            <svg
              className={`w-4 h-4 transition-transform ${showSimulation ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSimulation && <SimulationPanel />}
        </div>
        <VersionPanel />
      </div>
    );
  }

  const config = NODE_TYPE_CONFIG[selectedNode.data.nodeType];
  const bottleneck = analysisResult?.bottlenecks.find(
    (b) => b.nodeId === selectedNodeId
  );
  const comments = selectedNode.data.comments || [];
  const isTaskType = ['task', 'userTask', 'serviceTask', 'scriptTask', 'wait'].includes(
    selectedNode.data.nodeType
  );

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700">プロパティ</h3>
          <span
            className="text-xs px-2 py-1 rounded"
            style={{ backgroundColor: config.bgColor, color: config.color }}
          >
            {config.label}
          </span>
        </div>

        {bottleneck && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-bold text-red-600 mb-1">
              ボトルネック検出
            </div>
            <div className="text-xs text-red-700">{bottleneck.reason}</div>
            <div className="text-xs text-gray-600 mt-2">
              <strong>改善案:</strong> {bottleneck.suggestion}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* ステップ名 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ステップ名
            </label>
            <input
              type="text"
              value={selectedNode.data.label}
              onChange={(e) =>
                updateNodeData(selectedNodeId!, { label: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 担当者 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              担当者/部署
            </label>
            <input
              type="text"
              value={selectedNode.data.assignee || ''}
              onChange={(e) =>
                updateNodeData(selectedNodeId!, { assignee: e.target.value })
              }
              placeholder="例: 経理部、田中さん"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 所要時間 */}
          {isTaskType && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                所要時間（分）
              </label>
              <input
                type="number"
                min="0"
                value={selectedNode.data.duration || 0}
                onChange={(e) =>
                  updateNodeData(selectedNodeId!, {
                    duration: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-400 mt-1">
                {selectedNode.data.duration && selectedNode.data.duration >= 60
                  ? `= ${Math.floor(selectedNode.data.duration / 60)}時間${
                      selectedNode.data.duration % 60 > 0
                        ? `${selectedNode.data.duration % 60}分`
                        : ''
                    }`
                  : ''}
              </div>
            </div>
          )}

          {/* 改善タイプ（シミュレーション用） */}
          {isTaskType && (selectedNode.data.duration || 0) > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                改善シミュレーション
              </label>
              <select
                value={selectedNode.data.simulation?.improvementType || 'none'}
                onChange={(e) =>
                  updateNodeData(selectedNodeId!, {
                    simulation: {
                      ...selectedNode.data.simulation,
                      currentDuration: selectedNode.data.duration || 0,
                      improvementType: e.target.value as keyof typeof IMPROVEMENT_TYPES,
                      improvedDuration:
                        e.target.value === 'eliminate'
                          ? 0
                          : e.target.value === 'automate'
                          ? Math.round((selectedNode.data.duration || 0) * 0.1)
                          : e.target.value === 'optimize'
                          ? Math.round((selectedNode.data.duration || 0) * 0.5)
                          : undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(IMPROVEMENT_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
              {selectedNode.data.simulation?.improvementType &&
                selectedNode.data.simulation.improvementType !== 'none' && (
                  <div className="text-xs text-green-600 mt-1">
                    {selectedNode.data.duration}分 → {selectedNode.data.simulation.improvedDuration || 0}分
                  </div>
                )}
            </div>
          )}

          {/* 詳細説明 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              詳細説明
            </label>
            <textarea
              value={selectedNode.data.description || ''}
              onChange={(e) =>
                updateNodeData(selectedNodeId!, { description: e.target.value })
              }
              placeholder="このステップの詳細..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 課題メモ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              課題メモ
            </label>
            <textarea
              value={selectedNode.data.issues?.join('\n') || ''}
              onChange={(e) =>
                updateNodeData(selectedNodeId!, {
                  issues: e.target.value.split('\n').filter((s) => s.trim()),
                })
              }
              placeholder="改行で複数の課題を記入..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* コメント */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              コメント ({comments.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを追加..."
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
            {comments.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs"
                  >
                    <div className="flex-1">
                      <div className="text-gray-700">{comment.text}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5">
                        {new Date(comment.createdAt).toLocaleString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteComment(selectedNodeId!, comment.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 削除ボタン */}
          <button
            onClick={() => deleteNode(selectedNodeId!)}
            className="w-full px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors"
          >
            このノードを削除
          </button>
        </div>
      </div>

      {/* シミュレーションパネル */}
      <div className="border-t">
        <button
          onClick={() => setShowSimulation(!showSimulation)}
          className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>シミュレーション</span>
          <svg
            className={`w-4 h-4 transition-transform ${showSimulation ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showSimulation && <SimulationPanel />}
      </div>

      {/* バージョン履歴 */}
      <VersionPanel />
    </div>
  );
}
