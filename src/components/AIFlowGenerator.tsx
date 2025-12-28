'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/flowStore';

interface AIFlowGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIFlowGenerator({ isOpen, onClose }: AIFlowGeneratorProps) {
  const [manualText, setManualText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const setFlowName = useFlowStore((state) => state.setFlowName);

  const handleGenerate = async () => {
    if (!manualText.trim()) {
      setError('テキストを入力してください');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: manualText }),
      });

      if (!response.ok) {
        throw new Error('フロー生成に失敗しました');
      }

      const result = await response.json();

      if (result.nodes && result.edges) {
        setNodes(result.nodes);
        setEdges(result.edges);
        if (result.flowName) {
          setFlowName(result.flowName);
        }
        onClose();
      } else {
        throw new Error('無効なレスポンス形式');
      }
    } catch (err) {
      console.error('Generate error:', err);
      setError('フロー生成中にエラーが発生しました。APIキーが正しく設定されているか確認してください。');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            マニュアル → フロー図 変換
          </h2>
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            業務マニュアルや手順書のテキストを入力すると、AIがBPMNフロー図に変換します。
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              マニュアル / 手順書テキスト
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder={`例:
1. 従業員が経費申請書を作成する
2. 領収書を添付してシステムに登録
3. 上長が内容を確認し、承認または差戻し
4. 承認された場合、経理部が処理
5. 従業員の口座に振込

または箇条書き、段落形式でも可`}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <strong>ヒント:</strong>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              <li>番号付きリストや箇条書きで書くと精度が上がります</li>
              <li>「承認」「確認」「判断」などの言葉はゲートウェイに変換されます</li>
              <li>「待つ」「待機」などは待機ノードになります</li>
              <li>担当者や部署名を含めると自動的に設定されます</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
          >
            キャンセル
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !manualText.trim()}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
              isGenerating || !manualText.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                生成中...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                フロー図を生成
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
