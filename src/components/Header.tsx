'use client';

import { useState, useRef, useCallback } from 'react';
import { useFlowStore } from '@/store/flowStore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface HeaderProps {
  onAnalyze: () => void;
  onOpenAIGenerator: () => void;
}

export default function Header({ onAnalyze, onOpenAIGenerator }: HeaderProps) {
  const flowName = useFlowStore((state) => state.flowName);
  const setFlowName = useFlowStore((state) => state.setFlowName);
  const saveFlow = useFlowStore((state) => state.saveFlow);
  const newFlow = useFlowStore((state) => state.newFlow);
  const exportFlow = useFlowStore((state) => state.exportFlow);
  const importFlow = useFlowStore((state) => state.importFlow);
  const savedFlows = useFlowStore((state) => state.savedFlows);
  const loadFlow = useFlowStore((state) => state.loadFlow);
  const deleteFlow = useFlowStore((state) => state.deleteFlow);
  const isAnalyzing = useFlowStore((state) => state.isAnalyzing);
  const nodes = useFlowStore((state) => state.nodes);

  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPdf = useCallback(async () => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) {
      alert('フロー図が見つかりません');
      return;
    }

    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(flowElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // タイトル追加
      pdf.setFontSize(16);
      pdf.text(flowName || '無題のフロー', pdfWidth / 2, 10, { align: 'center' });

      pdf.addImage(
        imgData,
        'PNG',
        imgX,
        imgY + 10,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save(`${flowName || 'flow'}.pdf`);
      setSaveMessage('PDFを出力しました');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF出力に失敗しました');
    } finally {
      setIsExportingPdf(false);
    }
  }, [flowName]);

  const handleSave = () => {
    saveFlow();
    setSaveMessage('保存しました');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleExport = () => {
    const json = exportFlow();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowSaveMenu(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          importFlow(json);
          setSaveMessage('インポートしました');
          setTimeout(() => setSaveMessage(''), 2000);
        } catch {
          alert('ファイルの読み込みに失敗しました');
        }
      };
      reader.readAsText(file);
    }
    setShowLoadMenu(false);
  };

  const handleLoadFlow = (flowId: string) => {
    loadFlow(flowId);
    setShowLoadMenu(false);
  };

  const handleDeleteFlow = (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('このフローを削除しますか？')) {
      deleteFlow(flowId);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">
          Process Flow Visualizer
        </h1>
        <input
          type="text"
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="フロー名"
        />
        {saveMessage && (
          <span className="text-green-600 text-sm">{saveMessage}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* 新規作成 */}
        <button
          onClick={() => {
            if (confirm('現在のフローを破棄して新規作成しますか？')) {
              newFlow();
            }
          }}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          新規作成
        </button>

        {/* 保存メニュー */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSaveMenu(!showSaveMenu);
              setShowLoadMenu(false);
            }}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            保存
          </button>
          {showSaveMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={handleSave}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                ブラウザに保存
              </button>
              <button
                onClick={handleExport}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                JSONをエクスポート
              </button>
              <button
                onClick={() => {
                  handleExportPdf();
                  setShowSaveMenu(false);
                }}
                disabled={isExportingPdf || nodes.length === 0}
                className={`w-full px-4 py-2 text-sm text-left ${
                  isExportingPdf || nodes.length === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                {isExportingPdf ? 'PDF出力中...' : 'PDFをエクスポート'}
              </button>
            </div>
          )}
        </div>

        {/* 読込メニュー */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLoadMenu(!showLoadMenu);
              setShowSaveMenu(false);
            }}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            読込
          </button>
          {showLoadMenu && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 border-b border-gray-100"
              >
                JSONをインポート
              </button>
              {savedFlows.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                    保存済みフロー
                  </div>
                  {savedFlows.map((flow) => (
                    <div
                      key={flow.id}
                      onClick={() => handleLoadFlow(flow.id)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div>
                        <div className="text-sm">{flow.name}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(flow.updatedAt).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteFlow(flow.id, e)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  保存済みフローはありません
                </div>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* AI生成ボタン */}
        <button
          onClick={onOpenAIGenerator}
          className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
        >
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
          AI生成
        </button>

        {/* AI分析ボタン */}
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || nodes.length === 0}
          className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
            isAnalyzing || nodes.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          {isAnalyzing ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
              >
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
              分析中...
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI分析
            </>
          )}
        </button>
      </div>

      {/* クリックでメニューを閉じる */}
      {(showSaveMenu || showLoadMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSaveMenu(false);
            setShowLoadMenu(false);
          }}
        />
      )}
    </header>
  );
}
