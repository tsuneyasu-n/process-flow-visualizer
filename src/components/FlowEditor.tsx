'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '@/store/flowStore';
import ProcessNodeComponent from '@/components/nodes/ProcessNode';
import { NODE_TYPE_CONFIG } from '@/types/flow';

const nodeTypes = {
  processNode: ProcessNodeComponent,
};

export default function FlowEditor() {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const setSelectedNode = useFlowStore((state) => state.setSelectedNode);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
        }
      }
    },
    [selectedNodeId, deleteNode]
  );

  const nodeColor = useCallback((node: { data: { nodeType?: keyof typeof NODE_TYPE_CONFIG } }) => {
    return node.data?.nodeType ? NODE_TYPE_CONFIG[node.data.nodeType]?.color : '#888';
  }, []);

  return (
    <div
      className="flex-1 h-full"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
