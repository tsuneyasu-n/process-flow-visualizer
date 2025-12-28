'use client';

import { useFlowStore } from '@/store/flowStore';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalysisModal({ isOpen, onClose }: AnalysisModalProps) {
  const analysisResult = useFlowStore((state) => state.analysisResult);
  const nodes = useFlowStore((state) => state.nodes);
  const setSelectedNode = useFlowStore((state) => state.setSelectedNode);

  if (!isOpen || !analysisResult) return null;

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}時間${mins > 0 ? `${mins}分` : ''}`;
    }
    return `${minutes}分`;
  };

  const impactColor = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const impactLabel = {
    high: '大',
    medium: '中',
    low: '小',
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">AI分析結果</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* サマリー */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-blue-800 mb-2">サマリー</h3>
            <p className="text-sm text-blue-900">{analysisResult.summary}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <div className="bg-white rounded px-3 py-1">
                <span className="text-gray-500">総所要時間: </span>
                <span className="font-bold text-blue-800">
                  {formatDuration(analysisResult.totalDuration)}
                </span>
              </div>
              <div className="bg-white rounded px-3 py-1">
                <span className="text-gray-500">ステップ数: </span>
                <span className="font-bold text-blue-800">{nodes.length}</span>
              </div>
            </div>
          </div>

          {/* ボトルネック */}
          {analysisResult.bottlenecks.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                ボトルネック検出
              </h3>
              <div className="space-y-3">
                {analysisResult.bottlenecks.map((bottleneck, index) => (
                  <div
                    key={index}
                    className="bg-red-50 rounded-lg p-4 border border-red-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => handleNodeClick(bottleneck.nodeId)}
                        className="font-medium text-red-800 hover:underline"
                      >
                        {bottleneck.nodeName}
                      </button>
                    </div>
                    <p className="text-sm text-red-700 mb-2">
                      {bottleneck.reason}
                    </p>
                    <div className="bg-white rounded p-2">
                      <span className="text-xs text-gray-500">改善案: </span>
                      <span className="text-sm text-gray-800">
                        {bottleneck.suggestion}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 改善提案 */}
          {analysisResult.improvements.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                改善提案
              </h3>
              <div className="space-y-2">
                {analysisResult.improvements.map((improvement, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-3"
                  >
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        impactColor[improvement.impact]
                      }`}
                    >
                      影響度: {impactLabel[improvement.impact]}
                    </span>
                    <div className="flex-1">
                      <span className="text-xs text-purple-600 font-medium">
                        [{improvement.category}]
                      </span>
                      <p className="text-sm text-gray-800 mt-1">
                        {improvement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
