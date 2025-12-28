'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ProcessNodeData, NODE_TYPE_CONFIG } from '@/types/flow';
import { useFlowStore } from '@/store/flowStore';

interface ProcessNodeComponentProps {
  id: string;
  data: ProcessNodeData;
  selected?: boolean;
}

function ProcessNodeComponent({ id, data, selected }: ProcessNodeComponentProps) {
  const config = NODE_TYPE_CONFIG[data.nodeType];
  const setSelectedNode = useFlowStore((state) => state.setSelectedNode);
  const analysisResult = useFlowStore((state) => state.analysisResult);

  const isBottleneck = analysisResult?.bottlenecks.some((b) => b.nodeId === id);
  const hasComments = (data.comments?.length || 0) > 0;
  const hasImprovement = data.simulation?.improvementType && data.simulation.improvementType !== 'none';

  const handleClick = () => {
    setSelectedNode(id);
  };

  // 形状に応じたスタイル
  const getShapeStyle = () => {
    switch (config.shape) {
      case 'circle':
        return {
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          padding: '8px',
        };
      case 'diamond':
        return {
          width: '70px',
          height: '70px',
          transform: 'rotate(45deg)',
          padding: '8px',
        };
      default:
        return {
          minWidth: '140px',
          minHeight: '50px',
          borderRadius: '8px',
          padding: '12px 16px',
        };
    }
  };

  const shapeStyle = getShapeStyle();
  const isDiamond = config.shape === 'diamond';
  const isCircle = config.shape === 'circle';

  // ゲートウェイの記号
  const getGatewaySymbol = () => {
    switch (data.nodeType) {
      case 'exclusiveGateway':
        return '×';
      case 'parallelGateway':
        return '+';
      case 'inclusiveGateway':
        return '○';
      default:
        return '';
    }
  };

  return (
    <div onClick={handleClick} className="relative">
      <div
        className={`
          shadow-md border-2 transition-all cursor-pointer flex flex-col items-center justify-center
          ${selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
          ${isBottleneck ? 'ring-2 ring-red-500 ring-offset-1' : ''}
          ${hasImprovement ? 'ring-2 ring-green-400 ring-offset-1' : ''}
        `}
        style={{
          ...shapeStyle,
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        }}
      >
        <div style={{ transform: isDiamond ? 'rotate(-45deg)' : undefined }}>
          {/* ゲートウェイ記号 */}
          {config.category === 'gateway' && (
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: config.color }}
            >
              {getGatewaySymbol()}
            </div>
          )}

          {/* イベント・タスクのラベル */}
          {config.category !== 'gateway' && (
            <>
              {!isCircle && (
                <div
                  className="text-xs font-bold mb-0.5"
                  style={{ color: config.color }}
                >
                  {config.labelEn}
                </div>
              )}
              <div
                className={`font-medium text-gray-800 text-center break-words ${
                  isCircle ? 'text-xs' : 'text-sm'
                }`}
                style={{ maxWidth: isCircle ? '55px' : '120px' }}
              >
                {data.label}
              </div>
            </>
          )}

          {/* 担当者 */}
          {data.assignee && !isCircle && !isDiamond && (
            <div className="text-xs text-gray-500 mt-1">{data.assignee}</div>
          )}

          {/* 所要時間 */}
          {data.duration !== undefined && data.duration > 0 && !isCircle && !isDiamond && (
            <div className="text-xs text-gray-400 mt-0.5">
              {data.duration >= 60
                ? `${Math.floor(data.duration / 60)}h${data.duration % 60 > 0 ? `${data.duration % 60}m` : ''}`
                : `${data.duration}m`}
            </div>
          )}
        </div>
      </div>

      {/* バッジ類 */}
      {isBottleneck && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          !
        </div>
      )}
      {hasComments && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {data.comments?.length}
        </div>
      )}
      {hasImprovement && (
        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px]">
          改善
        </div>
      )}

      {/* ハンドル - 開始イベント以外に入力 */}
      {data.nodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      {/* ハンドル - 終了イベント以外に出力 */}
      {data.nodeType !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      {/* ゲートウェイは左右にもハンドル */}
      {config.category === 'gateway' && (
        <>
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
          />
        </>
      )}
    </div>
  );
}

export default memo(ProcessNodeComponent);
