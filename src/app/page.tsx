'use client';

import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Header from '@/components/Header';
import Toolbar from '@/components/Toolbar';
import FlowEditor from '@/components/FlowEditor';
import PropertyPanel from '@/components/PropertyPanel';
import AnalysisModal from '@/components/AnalysisModal';
import AIFlowGenerator from '@/components/AIFlowGenerator';
import { useFlowStore } from '@/store/flowStore';
import LicenseGate from '@/components/LicenseGate';

export default function Home() {
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const flowName = useFlowStore((state) => state.flowName);
  const setIsAnalyzing = useFlowStore((state) => state.setIsAnalyzing);
  const setAnalysisResult = useFlowStore((state) => state.setAnalysisResult);

  const handleAnalyze = async () => {
    if (nodes.length === 0) {
      alert('分析するノードがありません');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          edges,
          flowName,
        }),
      });

      if (!response.ok) {
        throw new Error('分析に失敗しました');
      }

      const result = await response.json();
      setAnalysisResult(result);
      setShowAnalysisModal(true);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('分析中にエラーが発生しました。APIキーが正しく設定されているか確認してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <LicenseGate appName="Process Flow Visualizer">
      <ReactFlowProvider>
        <div className="h-screen flex flex-col">
          <Header onAnalyze={handleAnalyze} onOpenAIGenerator={() => setShowAIGenerator(true)} />
          <div className="flex-1 flex overflow-hidden">
            <Toolbar />
            <FlowEditor />
            <PropertyPanel />
          </div>
        </div>
        <AnalysisModal
          isOpen={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
        />
        <AIFlowGenerator
          isOpen={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
        />
      </ReactFlowProvider>
    </LicenseGate>
  );
}
