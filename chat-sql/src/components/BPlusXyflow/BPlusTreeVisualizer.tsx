/**
 * B+树可视化组件 - 最终修复版
 * 内部管理动画和状态，仅在操作完成时通过回调通知父组件
 * 通过key prop实现外部强制重置
 */
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Node,
  Edge,
  BackgroundVariant,
  ReactFlowProvider,
  Panel,
  MarkerType,
  useReactFlow
} from '@xyflow/react';
import { Box, Alert, Snackbar, Tooltip } from '@mui/material';

import { BPlusTreeAlgorithm } from '../../lib/bplus-tree/algorithm';
import { AnimationManager, AnimationState } from '../../lib/bplus-tree/animationManager';
import { CommandExecutor } from '../../lib/bplus-tree/commandExecutor';
import AnimationControls from './AnimationControls';
import BPlusInternalNode from './BPlusInternalNode';
import BPlusLeafNode from './BPlusLeafNode';
import { BPlusNodeData } from '../utils/bPlusTreeToReactFlow';
import styles from './BPlusTreeVisualizer.module.css';
import '@xyflow/react/dist/style.css';

// --- 接口定义 ---
export interface TreeState {
  nodes: Node<BPlusNodeData>[];
  edges: Edge[];
  keys: number[];
  operation?: 'insert' | 'delete' | 'reset' | 'initial';
  operationKey?: number;
  timestamp: number;
}

export interface BPlusTreeOperations {
  insert: (key: number) => Promise<void>;
  delete: (key: number) => Promise<void>;
  reset: () => void;
}

interface BPlusTreeVisualizerProps {
  order: number;
  initialState?: TreeState; // 用于从历史记录恢复
  onStateChange?: (state: TreeState) => void;
  onOperationsReady?: (operations: BPlusTreeOperations) => void;
  onAnimationStateChange?: (isAnimating: boolean) => void;
  // 动画设置
  isAnimationEnabled?: boolean;
  animationSpeed?: number;
}

// --- 帮助函数 (布局和转换) ---
const layoutNodes = (nodes: Node<BPlusNodeData>[], _edges: Edge[]): Node<BPlusNodeData>[] => {
    if (!nodes || nodes.length === 0) return [];
    const levelGroups: { [level: number]: Node<BPlusNodeData>[] } = {};
    nodes.forEach(node => {
        const level = node.data.level;
        if (!levelGroups[level]) levelGroups[level] = [];
        levelGroups[level].push(node);
    });
    const layoutedNodes: Node<BPlusNodeData>[] = [];
    const levels = Object.keys(levelGroups).map(Number).sort((a, b) => b - a);
    levels.forEach((level, levelIndex) => {
        const nodesInLevel = levelGroups[level];
        nodesInLevel.sort((a, b) => {
            const firstKeyA = a.data.keys.find(k => k !== null) as number | undefined ?? Infinity;
            const firstKeyB = b.data.keys.find(k => k !== null) as number | undefined ?? Infinity;
            return firstKeyA - firstKeyB;
        });
        const logicalSlotWidth = 200;
        const levelWidth = nodesInLevel.length * logicalSlotWidth;
        const startX = -levelWidth / 2;
        nodesInLevel.forEach((node, index) => {
            const x = startX + index * logicalSlotWidth + logicalSlotWidth / 2;
            const y = levelIndex * 120;
            layoutedNodes.push({ ...node, position: { x, y } });
        });
    });
    return layoutedNodes;
};

const convertBPlusTreeToFlowData = (algorithm: BPlusTreeAlgorithm, order: number): { nodes: Node<BPlusNodeData>[], edges: Edge[] } => {
    const allNodes = algorithm.getAllNodes();
    const reactFlowNodes: Node<BPlusNodeData>[] = [];
    const reactFlowEdges: Edge[] = [];
    if (allNodes.length === 0) return { nodes: reactFlowNodes, edges: reactFlowEdges };
    allNodes.forEach(node => {
        let level = node.level;
        if (level === undefined) {
            level = 0;
            let current = node;
            while (current.parent) {
                level++;
                current = current.parent;
            }
        }
        const nodeKeys = node.keys.slice(0, node.numKeys);
        const paddedKeys = [...nodeKeys, ...Array(Math.max(0, order - 1 - nodeKeys.length)).fill(null)];
        let paddedPointers: (string | null)[] = Array(order).fill(null);
        if (!node.isLeaf && node.children) {
            node.children.forEach((child, index) => {
                if (child && child.graphicID && index < order) paddedPointers[index] = child.graphicID;
            });
        }
        reactFlowNodes.push({
            id: node.graphicID,
            type: node.isLeaf ? 'bPlusLeafNode' : 'bPlusInternalNode',
            position: { x: 0, y: 0 },
            data: { keys: paddedKeys, pointers: paddedPointers, isLeaf: node.isLeaf, level: level, order: order, next: node.next?.graphicID || null }
        });
        if (!node.isLeaf && node.children) {
            node.children.forEach((child, index) => {
                if (child && child.graphicID && node.graphicID && index <= node.numKeys) {
                    const edgeId = `${node.graphicID}-${child.graphicID}`;
                    if (!reactFlowEdges.some(e => e.id === edgeId)) {
                        reactFlowEdges.push({ id: edgeId, source: node.graphicID, target: child.graphicID, sourceHandle: `pointer-${index}`, targetHandle: 'top', type: 'straight', markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15 } });
                    }
                }
            });
        }
        if (node.isLeaf && node.next && node.next.graphicID && node.graphicID) {
            const edgeId = `${node.graphicID}-next-${node.next.graphicID}`;
            if (!reactFlowEdges.some(e => e.id === edgeId)) {
                reactFlowEdges.push({ id: edgeId, source: node.graphicID, target: node.next.graphicID, sourceHandle: 'sibling', targetHandle: 'sibling-target', type: 'straight', style: { stroke: 'var(--secondary-text)' }, markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15 } });
            }
        }
    });
    return { nodes: reactFlowNodes, edges: reactFlowEdges };
};

// --- 自定义控件 ---
const CustomZoomControls: React.FC<{ onReset: () => void }> = ({ onReset }) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    return (
        <Panel position="bottom-right" className="custom-zoom-controls">
            <Tooltip title="放大" placement="top"><button onClick={() => zoomIn({ duration: 800 })} className="zoom-button">+</button></Tooltip>
            <Tooltip title="缩小" placement="top"><button onClick={() => zoomOut({ duration: 800 })} className="zoom-button">-</button></Tooltip>
            <Tooltip title="适应视图" placement="top"><button onClick={() => fitView({ duration: 800, padding: 0.2 })} className="zoom-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button></Tooltip>
            <Tooltip title="重置" placement="top"><button onClick={onReset} className="zoom-button">↻</button></Tooltip>
        </Panel>
    );
  const reactFlowInstance = useReactFlow();
};

// --- 核心组件 ---
const BPlusTreeVisualizerInner: React.FC<BPlusTreeVisualizerProps> = ({
  order,
  initialState,
  onStateChange,
  onOperationsReady,
  onAnimationStateChange,
  isAnimationEnabled = true,
  animationSpeed = 500,
}) => {
  const bPlusTreeAlgorithmRef = useRef(new BPlusTreeAlgorithm(order));
  const animationManagerRef = useRef(new AnimationManager());
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BPlusNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [animationState, setAnimationState] = useState<AnimationState>(animationManagerRef.current.getState());
  const [settings, setSettings] = useState({
    isAnimationEnabled: isAnimationEnabled,
    animationSpeed: animationSpeed
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'info' | 'warning' | 'error' });
  const [isInitializing, setIsInitializing] = useState(true); // 标志是否正在初始化

  const showMessage = useCallback((message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // 监听外部动画设置变化
  useEffect(() => {
    setSettings({
      isAnimationEnabled: isAnimationEnabled,
      animationSpeed: animationSpeed
    });
  }, [isAnimationEnabled, animationSpeed]);

  const commandExecutorRef = useRef(new CommandExecutor({
    setNodes: (updater) => setNodes(updater),
    setEdges: (updater) => setEdges(updater),
    showMessage
  }));

  const updateView = useCallback((algorithm: BPlusTreeAlgorithm) => {
    const { nodes: newNodes, edges: newEdges } = convertBPlusTreeToFlowData(algorithm, order);
    const layouted = layoutNodes(newNodes, newEdges);
    setNodes(layouted);
    setEdges(newEdges);
  }, [order, setNodes, setEdges]);

  const notifyStateChange = useCallback((operation: 'insert' | 'delete' | 'reset' | 'initial', operationKey?: number) => {
    if (!onStateChange) return;

    // 在初始化期间跳过状态通知，避免创建重复的历史记录
    if (isInitializing && operation === 'initial') {
      return;
    }

    const algorithm = bPlusTreeAlgorithmRef.current;
    const { nodes, edges } = convertBPlusTreeToFlowData(algorithm, order);
    onStateChange({
      nodes,
      edges,
      keys: algorithm.getAllKeys(),
      operation,
      operationKey,
      timestamp: Date.now(),
    });
  }, [onStateChange, order, isInitializing]);

  // 初始化
  useEffect(() => {
    const algorithm = bPlusTreeAlgorithmRef.current;
    if (initialState) {
      // 从历史记录恢复：先清空算法，然后插入所有keys
      algorithm.clear();
      if (initialState.keys && initialState.keys.length > 0) {
        // 静默插入，不触发状态变更通知，避免创建重复的历史步骤
        initialState.keys.forEach(key => {
          algorithm.insertElement(key); // 这只是重建内部状态，不应该触发历史记录
        });
      }
    } else {
      // 创建一个默认的空树
      algorithm.clear();
    }
    updateView(algorithm);

    // 初始化完成，允许后续的状态变更通知
    setIsInitializing(false);
  }, []); // 依赖为空，仅在挂载时运行

  // 动画管理器设置
  useEffect(() => {
    const manager = animationManagerRef.current;
    manager.setSpeed(settings.animationSpeed);
    manager.setCallbacks({
      onStepChange: async (_, command) => {
        if (command) await commandExecutorRef.current.executeCommand(command);
      },
      onStateChange: (state) => {
        setAnimationState(state);
        onAnimationStateChange?.(state.isPlaying);
      },
      onComplete: () => {
        showMessage('动画播放完成', 'success');
        updateView(bPlusTreeAlgorithmRef.current);
        notifyStateChange(manager.lastOperation, manager.lastKey);
      },
      onError: (error) => showMessage(error.message, 'error'),
    });
  }, [settings.animationSpeed, onAnimationStateChange, showMessage, updateView, notifyStateChange]);

  // 操作函数
  const runOperation = useCallback(async (operation: 'insert' | 'delete', key: number) => {
    const algorithm = bPlusTreeAlgorithmRef.current;
    const manager = animationManagerRef.current;
    manager.lastOperation = operation;
    manager.lastKey = key;

    const commands = operation === 'insert' ? algorithm.insertElement(key) : algorithm.deleteElement(key);

    if (settings.isAnimationEnabled) {
      manager.loadCommands(commands);
      await manager.playAll();
    } else {
      await commandExecutorRef.current.executeCommands(commands);
      updateView(algorithm);
      notifyStateChange(operation, key);
    }
  }, [settings.isAnimationEnabled, updateView, notifyStateChange]);

  const handleInsert = useCallback(async (key: number) => {
    if (bPlusTreeAlgorithmRef.current.find(key)) {
      showMessage(`键 ${key} 已存在`, 'warning');
      return;
    }
    await runOperation('insert', key);
  }, [runOperation, showMessage]);

  const handleDelete = useCallback(async (key: number) => {
    if (!bPlusTreeAlgorithmRef.current.find(key)) {
      showMessage(`键 ${key} 不存在`, 'warning');
      return;
    }
    await runOperation('delete', key);
  }, [runOperation, showMessage]);

  const handleReset = useCallback(() => {
    animationManagerRef.current.stop();
    bPlusTreeAlgorithmRef.current.clear();
    updateView(bPlusTreeAlgorithmRef.current);
    notifyStateChange('reset');
    showMessage('B+树已重置', 'info');
  }, [updateView, notifyStateChange, showMessage]);

  // 暴露操作接口
  useEffect(() => {
    onOperationsReady?.({ insert: handleInsert, delete: handleDelete, reset: handleReset });
  }, [onOperationsReady, handleInsert, handleDelete, handleReset]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={{ bPlusInternalNode: BPlusInternalNode, bPlusLeafNode: BPlusLeafNode }}
        fitView
        fitViewOptions={{ padding: 0.4 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <CustomZoomControls onReset={handleReset} />
      </ReactFlow>
      <Panel
        position="top-left"
        style={{
          zIndex: 10,
          top: '10px',
          left: '10px',
          transition: 'all 0.25s ease-in-out',
          opacity: isAnimationEnabled ? 1 : 0,
          transform: isAnimationEnabled ? 'translateX(0)' : 'translateX(-10px)',
          pointerEvents: isAnimationEnabled ? 'auto' : 'none',
        }}
      >
        <AnimationControls
          animationState={animationState}
          onPlay={() => animationManagerRef.current.playAll()}
          onPause={() => animationManagerRef.current.pause()}
          onStop={() => {
            animationManagerRef.current.stop();
            updateView(bPlusTreeAlgorithmRef.current);
          }}
          onStepForward={() => animationManagerRef.current.stepForward()}
          onStepBackward={() => animationManagerRef.current.stepBackward()}
          onJumpToStep={(step) => animationManagerRef.current.jumpToStep(step)}
          onSpeedChange={(speed) => setSettings(s => ({ ...s, animationSpeed: speed }))}
          onReset={() => animationManagerRef.current.reset()}
          breakpoints={animationManagerRef.current.getStepBreakpoints()}
          disabled={!settings.isAnimationEnabled}
        />
      </Panel>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({...s, open: false}))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({...s, open: false}))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// 外层封装
const BPlusTreeVisualizer: React.FC<BPlusTreeVisualizerProps> = (props) => (
  <ReactFlowProvider>
    <BPlusTreeVisualizerInner {...props} />
  </ReactFlowProvider>
);

export default BPlusTreeVisualizer;
