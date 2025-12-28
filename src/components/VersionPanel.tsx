'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/flowStore';

export default function VersionPanel() {
  const versions = useFlowStore((state) => state.versions);
  const saveVersion = useFlowStore((state) => state.saveVersion);
  const loadVersion = useFlowStore((state) => state.loadVersion);
  const deleteVersion = useFlowStore((state) => state.deleteVersion);
  const [comment, setComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSaveVersion = () => {
    saveVersion(comment || undefined);
    setComment('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>バージョン履歴 ({versions.length})</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* 新規バージョン保存 */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="コメント（任意）"
              className="flex-1 px-2 py-1 border rounded text-xs"
            />
            <button
              onClick={handleSaveVersion}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              保存
            </button>
          </div>

          {/* バージョン一覧 */}
          {versions.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-2">
              バージョン履歴がありません
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...versions].reverse().map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-700 truncate">
                      v{versions.length - index}: {version.comment || '無題'}
                    </div>
                    <div className="text-gray-400">
                      {formatDate(version.savedAt)}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => loadVersion(version.id)}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      title="このバージョンを復元"
                    >
                      復元
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('このバージョンを削除しますか？')) {
                          deleteVersion(version.id);
                        }
                      }}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
