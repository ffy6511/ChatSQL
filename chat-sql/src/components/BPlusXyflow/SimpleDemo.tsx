'use client';

import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType
} from '@xyflow/react';
import BPlusInternalNode from './BPlusInternalNode';
import BPlusLeafNode from './BPlusLeafNode';
import '@xyflow/react/dist/style.css';

// 节点数据接口
interface BPlusNodeData {
  keys: (number | string | null)[];
  pointers: (string | null)[];
  isLeaf: boolean;
  level: number;
}

// 自定义节点类型
const nodeTypes = {
  bPlusInternalNode: BPlusInternalNode,
  bPlusLeafNode: BPlusLeafNode,
};

// 简单的数据生成函数
function generateBPlusTreeData(keys: number[], order: number): { nodes: any[], edges: Edge[] } {
  const nodes: any[] = [];
  const edges: Edge[] = [];

  if (keys.length === 0) {
    return { nodes, edges };
  }

  // 创建一个简单的叶子节点
  const leafNode: Node<BPlusNodeData> = {
    id: 'leaf-1',
    type: 'bPlusLeafNode',
    position: { x: 100, y: 300 },
    data: {
      keys: keys.slice(0, order - 1).concat(Array(Math.max(0, order - 1 - keys.length)).fill(null)),
      pointers: Array(order).fill(null),
      isLeaf: true,
      level: 0
    }
  };

  nodes.push(leafNode);

  // 如果键太多，创建多个叶子节点
  if (keys.length > order - 1) {
    const remainingKeys = keys.slice(order - 1);
    const leafNode2: Node<BPlusNodeData> = {
      id: 'leaf-2',
      type: 'bPlusLeafNode',
      position: { x: 400, y: 300 },
      data: {
        keys: remainingKeys.slice(0, order - 1).concat(Array(Math.max(0, order - 1 - remainingKeys.length)).fill(null)),
        pointers: [null, null, 'leaf-1'], // 兄弟指针指向leaf-1
        isLeaf: true,
        level: 0
      }
    };

    nodes.push(leafNode2);

    // 更新第一个叶子节点的兄弟指针
    leafNode.data.pointers[order - 1] = 'leaf-2';

    // 创建内部节点
    const internalNode: Node<BPlusNodeData> = {
      id: 'internal-1',
      type: 'bPlusInternalNode',
      position: { x: 250, y: 150 },
      data: {
        keys: [remainingKeys[0]].concat(Array(order - 2).fill(null)),
        pointers: ['leaf-1', 'leaf-2'].concat(Array(order - 2).fill(null)),
        isLeaf: false,
        level: 1
      }
    };

    nodes.push(internalNode);

    // 创建边
    edges.push({
      id: 'internal-1-leaf-1',
      source: 'internal-1',
      target: 'leaf-1',
      sourceHandle: 'pointer-0',
      targetHandle: 'top',
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
      style: { stroke: '#333', strokeWidth: 2 }
    });

    edges.push({
      id: 'internal-1-leaf-2',
      source: 'internal-1',
      target: 'leaf-2',
      sourceHandle: 'pointer-1',
      targetHandle: 'top',
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
      style: { stroke: '#333', strokeWidth: 2 }
    });

    // 兄弟连接
    edges.push({
      id: 'leaf-1-sibling-leaf-2',
      source: 'leaf-1',
      target: 'leaf-2',
      sourceHandle: 'sibling',
      targetHandle: 'sibling-target',
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
      style: { stroke: '#666', strokeWidth: 2 }
    });

    // 如果还有更多键，创建第三层
    if (keys.length > 2 * (order - 1)) {
      const moreKeys = keys.slice(2 * (order - 1));
      const leafNode3: Node<BPlusNodeData> = {
        id: 'leaf-3',
        type: 'bPlusLeafNode',
        position: { x: 700, y: 300 },
        data: {
          keys: moreKeys.slice(0, order - 1).concat(Array(Math.max(0, order - 1 - moreKeys.length)).fill(null)),
          pointers: Array(order).fill(null),
          isLeaf: true,
          level: 0
        }
      };

      nodes.push(leafNode3);

      // 更新兄弟指针
      leafNode2.data.pointers[order - 1] = 'leaf-3';

      // 更新内部节点
      internalNode.data.keys[1] = moreKeys[0];
      internalNode.data.pointers[2] = 'leaf-3';

      // 添加新边
      edges.push({
        id: 'internal-1-leaf-3',
        source: 'internal-1',
        target: 'leaf-3',
        sourceHandle: 'pointer-2',
        targetHandle: 'top',
        type: 'default',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
        },
        style: { stroke: '#333', strokeWidth: 2 }
      });

      edges.push({
        id: 'leaf-2-sibling-leaf-3',
        source: 'leaf-2',
        target: 'leaf-3',
        sourceHandle: 'sibling',
        targetHandle: 'sibling-target',
        type: 'default',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
        },
        style: { stroke: '#666', strokeWidth: 2 }
      });
    }
  }

  return { nodes, edges };
}

const SimpleDemo: React.FC = () => {
  const [keys, setKeys] = useState<number[]>([10, 20, 5, 15, 25, 30, 35]);
  const [order, setOrder] = useState<number>(4);

  // 生成React Flow数据
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return generateBPlusTreeData(keys.sort((a, b) => a - b), order);
  }, [keys, order]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 更新节点和边
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateBPlusTreeData(keys.sort((a, b) => a - b), order);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [keys, order, setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '16px',
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd'
      }}>
        <h1 style={{ margin: '0 0 16px 0' }}>B+树可视化演示</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label>
            阶数 (M):
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Math.max(2, parseInt(e.target.value) || 2))}
              min="2"
              max="10"
              style={{ marginLeft: '8px', width: '60px' }}
            />
          </label>
          <div>
            <strong>当前键:</strong> [{keys.join(', ')}]
          </div>
        </div>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.2,
              includeHiddenNodes: false,
            }}
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <Controls
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap
              nodeColor={(node) => {
                return node.type === 'bPlusLeafNode' ? '#fbe9e7' : '#e0f2f7';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default SimpleDemo;
