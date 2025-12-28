'use client';

import { useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { IMPROVEMENT_TYPES } from '@/types/flow';

export default function SimulationPanel() {
  const nodes = useFlowStore((state) => state.nodes);
  const simulationResult = useFlowStore((state) => state.simulationResult);
  const calculateSimulation = useFlowStore((state) => state.calculateSimulation);
  const defaultHourlyRate = useFlowStore((state) => state.defaultHourlyRate);
  const defaultAnnualFrequency = useFlowStore((state) => state.defaultAnnualFrequency);
  const setDefaultHourlyRate = useFlowStore((state) => state.setDefaultHourlyRate);
  const setDefaultAnnualFrequency = useFlowStore((state) => state.setDefaultAnnualFrequency);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // ノードが変更されたら再計算
  useEffect(() => {
    if (nodes.length > 0) {
      calculateSimulation();
    }
  }, [nodes, defaultHourlyRate, defaultAnnualFrequency, calculateSimulation]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)} 時間`;
  };

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}時間${m > 0 ? `${m}分` : ''}`;
    }
    return `${minutes}分`;
  };

  // 改善対象のノード
  const improvableNodes = nodes.filter(
    (n) =>
      ['task', 'userTask', 'serviceTask', 'scriptTask', 'wait'].includes(
        n.data.nodeType
      ) && (n.data.duration as number) > 0
  );

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3">
        シミュレーション（What-if分析）
      </h3>

      {/* 設定 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">時給（円）</label>
          <input
            type="number"
            value={defaultHourlyRate}
            onChange={(e) => setDefaultHourlyRate(parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">年間回数</label>
          <input
            type="number"
            value={defaultAnnualFrequency}
            onChange={(e) =>
              setDefaultAnnualFrequency(parseInt(e.target.value) || 0)
            }
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      </div>

      {/* 改善設定 */}
      {improvableNodes.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-2">
            ステップ別改善設定
          </label>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {improvableNodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
              >
                <div className="flex-1 truncate" title={node.data.label}>
                  {node.data.label}
                  <span className="text-gray-400 ml-1">
                    ({formatMinutes((node.data.duration as number) || 0)})
                  </span>
                </div>
                <select
                  value={node.data.simulation?.improvementType || 'none'}
                  onChange={(e) =>
                    updateNodeData(node.id, {
                      simulation: {
                        ...node.data.simulation,
                        currentDuration: (node.data.duration as number) || 0,
                        improvementType: e.target.value as keyof typeof IMPROVEMENT_TYPES,
                        improvedDuration:
                          e.target.value === 'eliminate'
                            ? 0
                            : e.target.value === 'automate'
                            ? Math.round(((node.data.duration as number) || 0) * 0.1)
                            : e.target.value === 'optimize'
                            ? Math.round(((node.data.duration as number) || 0) * 0.5)
                            : undefined,
                      },
                    })
                  }
                  className="px-2 py-1 border rounded text-xs"
                >
                  {Object.entries(IMPROVEMENT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 結果 */}
      {simulationResult && (
        <div className="space-y-3">
          {/* Before / After 比較 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-100 rounded">
              <div className="text-xs text-gray-500 mb-1">現状 (Before)</div>
              <div className="text-lg font-bold text-gray-800">
                {formatMinutes(simulationResult.currentTotal.duration)}
              </div>
              <div className="text-xs text-gray-500">
                年間: {formatHours(simulationResult.currentTotal.annualHours)}
              </div>
              <div className="text-sm font-medium text-gray-700">
                {formatCurrency(simulationResult.currentTotal.annualCost)}/年
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="text-xs text-green-600 mb-1">改善後 (After)</div>
              <div className="text-lg font-bold text-green-700">
                {formatMinutes(simulationResult.improvedTotal.duration)}
              </div>
              <div className="text-xs text-green-600">
                年間: {formatHours(simulationResult.improvedTotal.annualHours)}
              </div>
              <div className="text-sm font-medium text-green-700">
                {formatCurrency(simulationResult.improvedTotal.annualCost)}/年
              </div>
            </div>
          </div>

          {/* 削減効果 */}
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-600 mb-2">削減効果</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">1回あたり:</span>
                <span className="font-bold text-blue-700 ml-1">
                  -{formatMinutes(simulationResult.savings.duration)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">年間時間:</span>
                <span className="font-bold text-blue-700 ml-1">
                  -{formatHours(simulationResult.savings.annualHours)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">年間コスト:</span>
                <span className="font-bold text-blue-700 ml-1">
                  -{formatCurrency(simulationResult.savings.annualCost)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">3年間効果:</span>
                <span className="font-bold text-blue-700 ml-1">
                  -{formatCurrency(simulationResult.savings.threeYearCost)}
                </span>
              </div>
            </div>
          </div>

          {/* 削減率 */}
          {simulationResult.currentTotal.duration > 0 && (
            <div className="text-center">
              <span className="text-2xl font-bold text-green-600">
                {Math.round(
                  (simulationResult.savings.duration /
                    simulationResult.currentTotal.duration) *
                    100
                )}
                %
              </span>
              <span className="text-gray-500 ml-2">削減</span>
            </div>
          )}
        </div>
      )}

      {nodes.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          ノードを追加するとシミュレーションが表示されます
        </div>
      )}
    </div>
  );
}
