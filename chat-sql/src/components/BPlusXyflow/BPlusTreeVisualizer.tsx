import React, { useEffect, useMemo, useState } from 'react';
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
  BackgroundVariant
} from '@xyflow/react';
// import { graphStratify, sugiyama } from 'd3-dag';
import { bPlusTreeToReactFlow, BPlusNodeData } from '../utils/bPlusTreeToReactFlow';
import BPlusInternalNode from './BPlusInternalNode';
import BPlusLeafNode from './BPlusLeafNode';
import styles from './BPlusTreeVisualizer.module.css';
import '@xyflow/react/dist/style.css';

// 自定义节点类型
const nodeTypes = {
  bPlusInternalNode: BPlusInternalNode,
  bPlusLeafNode: BPlusLeafNode,
};

interface BPlusTreeVisualizerProps {
  initialKeys: (number | string)[];
  order: number;
}

// 布局算法
const layoutNodes = (nodes: Node<BPlusNodeData>[], edges: Edge[]): Node<BPlusNodeData>[] => {
  if (nodes.length === 0) return nodes;

  // 简单的层级布局
  const levelGroups: { [level: number]: Node<BPlusNodeData>[] } = {};
  nodes.forEach(node => {
    const level = node.data.level;
    if (!levelGroups[level]) levelGroups[level] = [];
    levelGroups[level].push(node);
  });

  const layoutedNodes: Node<BPlusNodeData>[] = [];
  const levels = Object.keys(levelGroups).map(Number).sort((a, b) => b - a); // 从高到低排序

  levels.forEach((level, levelIndex) => {
    const nodesInLevel = levelGroups[level];
    const nodeWidth = 280; // 节点宽度
    const levelWidth = nodesInLevel.length * nodeWidth;
    const startX = -levelWidth / 2 + nodeWidth / 2; // 居中对齐

    nodesInLevel.forEach((node, index) => {
      layoutedNodes.push({
        ...node,
        position: {
          x: startX + index * nodeWidth,
          y: levelIndex * 180 // 层级间距
        }
      });
    });
  });

  return layoutedNodes;
};

const BPlusTreeVisualizer: React.FC<BPlusTreeVisualizerProps> = ({
  initialKeys,
  order
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 生成React Flow数据
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return bPlusTreeToReactFlow(initialKeys, order);
  }, [initialKeys, order]);

  // 应用布局
  const layoutedNodes = useMemo(() => {
    return layoutNodes(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 更新节点和边
  useEffect(() => {
    const newLayoutedNodes = layoutNodes(initialNodes, initialEdges);
    setNodes(newLayoutedNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // 检测系统主题
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className={`${styles['bplus-visualizer']} ${isDarkMode ? styles['dark-mode'] : ''}`}>
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
            className={styles['bplus-controls']}
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <MiniMap
            className={styles['bplus-minimap']}
            nodeColor={(node) => {
              return node.type === 'bPlusLeafNode' ? '#fbe9e7' : '#e0f2f7';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className={styles['bplus-background']}
          />
        </ReactFlow>
      </ReactFlowProvider>

      <div className={styles['bplus-info-panel']}>
        <div className={styles['bplus-tree-stats']}>
          <h3>B+树统计信息</h3>
          <p>阶数 (M): {order}</p>
          <p>节点总数: {nodes.length}</p>
          <p>叶子节点: {nodes.filter(n => n.data.isLeaf).length}</p>
          <p>内部节点: {nodes.filter(n => !n.data.isLeaf).length}</p>
          <p>键总数: {initialKeys.length}</p>
        </div>
      </div>
    </div>
  );
};

export default BPlusTreeVisualizer;
