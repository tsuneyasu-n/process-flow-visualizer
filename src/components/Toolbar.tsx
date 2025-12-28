'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { NodeType, NODE_TYPE_CONFIG } from '@/types/flow';
import { demoFlows } from '@/data/demoFlows';

// カテゴリ別ノードタイプ
const nodeCategories = {
  event: {
    label: 'イベント',
    types: ['start', 'intermediate', 'end'] as NodeType[],
  },
  task: {
    label: 'タスク',
    types: ['task', 'userTask', 'serviceTask', 'scriptTask'] as NodeType[],
  },
  gateway: {
    label: 'ゲートウェイ',
    types: ['exclusiveGateway', 'parallelGateway', 'inclusiveGateway'] as NodeType[],
  },
  other: {
    label: 'その他',
    types: ['wait', 'subprocess'] as NodeType[],
  },
};

export default function Toolbar() {
  const addNode = useFlowStore((state) => state.addNode);
  const nodes = useFlowStore((state) => state.nodes);
  const importFlow = useFlowStore((state) => state.importFlow);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('task');

  const handleAddNode = (type: NodeType) => {
    const existingNodes = nodes;
    const maxY = existingNodes.length > 0
      ? Math.max(...existingNodes.map((n) => n.position.y)) + 120
      : 100;
    const centerX = 400;

    addNode(type, { x: centerX, y: maxY });
  };

  const handleLoadDemo = (demoId: string) => {
    const demo = demoFlows.find((d) => d.id === demoId);
    if (demo) {
      importFlow(JSON.stringify(demo));
      setShowDemoMenu(false);
    }
  };

  const getShapeIcon = (shape: string, color: string) => {
    switch (shape) {
      case 'circle':
        return (
          <div
            className="w-4 h-4 rounded-full border-2"
            style={{ borderColor: color }}
          />
        );
      case 'diamond':
        return (
          <div
            className="w-3 h-3 rotate-45 border-2"
            style={{ borderColor: color }}
          />
        );
      default:
        return (
          <div
            className="w-4 h-3 rounded border-2"
            style={{ borderColor: color }}
          />
        );
    }
  };

  return (
    <div className="bg-white border-r border-gray-200 p-3 w-52 flex flex-col gap-1 overflow-y-auto">
      <h3 className="text-sm font-bold text-gray-700 mb-2">BPMN ノード</h3>

      {Object.entries(nodeCategories).map(([key, category]) => (
        <div key={key} className="mb-2">
          <button
            onClick={() =>
              setExpandedCategory(expandedCategory === key ? null : key)
            }
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded"
          >
            <span>{category.label}</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                expandedCategory === key ? 'rotate-180' : ''
              }`}
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

          {expandedCategory === key && (
            <div className="mt-1 space-y-1">
              {category.types.map((type) => {
                const config = NODE_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleAddNode(type)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded border hover:shadow-sm transition-all text-left text-xs"
                    style={{
                      backgroundColor: config.bgColor,
                      borderColor: config.borderColor,
                    }}
                  >
                    {getShapeIcon(config.shape, config.color)}
                    <span className="text-gray-700 truncate">
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <hr className="my-2 border-gray-200" />

      {/* デモデータ */}
      <div className="relative">
        <button
          onClick={() => setShowDemoMenu(!showDemoMenu)}
          className="w-full px-2 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-medium hover:bg-purple-100 transition-colors"
        >
          デモデータを読込
        </button>
        {showDemoMenu && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {demoFlows.map((demo) => (
              <button
                key={demo.id}
                onClick={() => handleLoadDemo(demo.id)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-xs font-medium text-gray-800">
                  {demo.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {demo.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="my-2 border-gray-200" />

      <div className="text-xs text-gray-400 space-y-0.5">
        <p className="font-medium text-gray-500">ヒント:</p>
        <p>・ドラッグで移動</p>
        <p>・下部から接続</p>
        <p>・クリックで編集</p>
        <p>・Deleteで削除</p>
      </div>

      {showDemoMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDemoMenu(false)}
        />
      )}
    </div>
  );
}
