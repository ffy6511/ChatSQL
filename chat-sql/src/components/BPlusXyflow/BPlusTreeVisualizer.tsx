import React, { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
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
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
// import { graphStratify, sugiyama } from 'd3-dag';
import { bPlusTreeToReactFlow, BPlusNodeData } from '../utils/bPlusTreeToReactFlow';
import { BPlusTree, AnimationStep } from '../../lib/bPlusTree';
import BPlusInternalNode from './BPlusInternalNode';
import BPlusLeafNode from './BPlusLeafNode';
import SettingsPanel from './SettingsPanel';
import styles from './BPlusTreeVisualizer.module.css';
import '@xyflow/react/dist/style.css';
import { message } from 'antd';
import { RedoOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined } from '@ant-design/icons';
import { Panel, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Tooltip } from 'antd';

// 自定义节点类型
const nodeTypes = {
  bPlusInternalNode: BPlusInternalNode,
  bPlusLeafNode: BPlusLeafNode,
};

interface BPlusTreeVisualizerProps {
  initialKeys: (number | string)[];
  order: number;
}

// 设置接口
interface Settings {
  isAnimationEnabled: boolean;
  animationSpeed: number; // 毫秒
}

// 布局算法
const layoutNodes = (nodes: Node<BPlusNodeData>[], edges: Edge[]): Node<BPlusNodeData>[] => {
  if (nodes.length === 0) return nodes;

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

    // --- 核心布局逻辑重构 ---
    const logicalSlotWidth = 200; // 为每个节点分配一个固定的“逻辑槽位”宽度
    const levelWidth = nodesInLevel.length * logicalSlotWidth;
    const startX = -levelWidth / 2;

    nodesInLevel.forEach((node, index) => {
      // 计算每个节点在自己的逻辑槽位中的中心X坐标
      const x = startX + index * logicalSlotWidth + logicalSlotWidth / 2;
      const y = levelIndex * 180;

      layoutedNodes.push({
        ...node,
        position: { x, y }
      });
    });
    // --- 重构结束 ---
  });

  return layoutedNodes;
};

// 自定义横向排列的操作按钮组件
const CustomZoomControls: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <Panel position="bottom-right" className={styles['bplus-custom-controls']}>
      <Tooltip title="放大" placement="top">
        <button
          className={styles['bplus-zoom-button']}
          onClick={() => zoomIn({ duration: 800 })}
          aria-label="放大"
        >
          <ZoomInOutlined />
        </button>
      </Tooltip>
      <Tooltip title="缩小" placement="top">
        <button
          className={styles['bplus-zoom-button']}
          onClick={() => zoomOut({ duration: 800 })}
          aria-label="缩小"
        >
          <ZoomOutOutlined />
        </button>
      </Tooltip>
      <Tooltip title="适应视图" placement="top">
        <button
          className={styles['bplus-zoom-button'] + ' ' + styles['bplus-fit-button']}
          onClick={() => fitView({ duration: 800, padding: 0.2 })}
          aria-label="适应视图"
        >
          <FullscreenOutlined />
        </button>
      </Tooltip>
      <Tooltip title="重置为初始状态" placement="top">
        <button
          className={styles['bplus-zoom-button'] + ' ' + styles['bplus-reset-button']}
          onClick={onReset}
          aria-label="重置为初始状态"
        >
          <RedoOutlined />
        </button>
      </Tooltip>
    </Panel>
  );
};

const BPlusTreeVisualizer: React.FC<BPlusTreeVisualizerProps> = ({
  initialKeys,
  order
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // B+树实例
  const [bPlusTree] = useState(() => new BPlusTree(order));

  // 设置状态
  const [settings, setSettings] = useState<Settings>({
    isAnimationEnabled: true,
    animationSpeed: 500
  });

  // 动画和交互状态
  const [insertValue, setInsertValue] = useState<string>('');
  const [deleteValue, setDeleteValue] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string>('');
  const [messageApi, contextHolder] = message.useMessage();

  // 将B+树转换为React Flow数据
  const convertTreeToReactFlow = useMemo(() => {
    return () => {
      const allNodes = bPlusTree.getAllNodes();
      const reactFlowNodes: Node<BPlusNodeData>[] = [];
      const reactFlowEdges: Edge[] = [];

      allNodes.forEach(node => {
        reactFlowNodes.push({
          id: node.id,
          type: node.isLeaf ? 'bPlusLeafNode' : 'bPlusInternalNode',
          position: { x: 0, y: 0 },
          data: {
            keys: [...node.keys, ...Array(order - 1 - node.keys.length).fill(null)],
            pointers: [...node.pointers, ...Array(order - node.pointers.length).fill(null)],
            isLeaf: node.isLeaf,
            level: node.level,
            order: order,
            next: node.next // 添加next属性
          }
        });

        // 创建边
        node.pointers.forEach((pointerId, index) => {
          if (pointerId) {
            reactFlowEdges.push({
              id: `${node.id}-${pointerId}`,
              source: node.id,
              target: pointerId,
              sourceHandle: node.isLeaf ? 'sibling' : `pointer-${index}`,
              targetHandle: 'top',
              type: 'straight',
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
              },
            });
          }
        });

        // 叶子节点的兄弟指针
        if (node.isLeaf && node.next) {
          reactFlowEdges.push({
            id: `${node.id}-next-${node.next}`,
            source: node.id,
            target: node.next,
            sourceHandle: 'sibling',
            targetHandle: 'sibling-target',
            type: 'straight',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
            },
            style: { stroke: '#999' }
          });
        }
      });

      return { nodes: reactFlowNodes, edges: reactFlowEdges };
    };
  }, [bPlusTree, order]);

  // 统一更新视图函数
  const updateView = () => {
    const { nodes: newNodes, edges: newEdges } = convertTreeToReactFlow();
    const layoutedNewNodes = layoutNodes(newNodes, newEdges);
    setNodes(layoutedNewNodes);
    setEdges(newEdges);
  };

  // 生成React Flow数据
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // 初始化B+树
    bPlusTree.clear();
    initialKeys.forEach(key => {
      if (typeof key === 'number') {
        const generator = bPlusTree.insert(key);
        // 同步执行所有步骤
        let result = generator.next();
        while (!result.done) {
          result = generator.next();
        }
      }
    });

    return convertTreeToReactFlow();
  }, [initialKeys, order, bPlusTree, convertTreeToReactFlow]);

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

  // 数值验证函数
  const validateInput = (value: string): boolean => {
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
  };

  // 执行动画步骤
  const executeAnimationStep = async (step: AnimationStep) => {
    console.log('执行动画步骤:', step);

    switch (step.type) {
      case 'traverse':
        // 非结构性变化：仅修改className，避免重新计算布局
        setNodes(prevNodes =>
          prevNodes.map(node => ({
            ...node,
            className: node.id === step.nodeId ? styles.nodeHighlighted : ''
          }))
        );

        setEdges(prevEdges =>
          prevEdges.map(edge => ({
            ...edge,
            className: edge.source === step.nodeId || edge.target === step.nodeId
              ? styles.edgeHighlighted : ''
          }))
        );
        break;

      case 'insert_key':
      case 'delete_key':
        // 非结构性变化：先高亮节点
        const highlightClass = step.type === 'insert_key' ? styles.nodeHighlighted : styles.nodeRemoving;
        setNodes(prevNodes =>
          prevNodes.map(node => ({
            ...node,
            className: node.id === step.nodeId ? highlightClass : ''
          }))
        );

        // 短暂延迟显示高亮效果
        if (settings.isAnimationEnabled) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        break;

      case 'split':
        // 分裂动画：先高亮原节点
        setNodes(prevNodes =>
          prevNodes.map(node => ({
            ...node,
            className: node.id === step.originalNodeId ? styles.nodeHighlighted : ''
          }))
        );

        if (settings.isAnimationEnabled) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // 更新整个树结构
        updateView();

        // 为新节点添加出现动画
        setNodes(prevNodes =>
          prevNodes.map(node => ({
            ...node,
            className: node.id === step.newNodeId ? styles.nodeNew : ''
          }))
        );
        break;

      case 'merge':
        // 合并动画：高亮参与合并的节点
        setNodes(prevNodes =>
          prevNodes.map(node => ({
            ...node,
            className: (node.id === step.nodeId1 || node.id === step.nodeId2) ? styles.nodeHighlighted : ''
          }))
        );

        if (settings.isAnimationEnabled) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // 更新整个树结构
        updateView();
        break;

      case 'redistribute':
        // 重新分配动画：高亮参与的节点
        setNodes(prevNodes =>
          prevNodes.map(node => ({
            ...node,
            className: (node.id === step.fromNodeId || node.id === step.toNodeId) ? styles.nodeHighlighted : ''
          }))
        );

        if (settings.isAnimationEnabled) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // 更新整个树结构
        updateView();
        break;

      case 'update_parent':
        // 父节点索引键更新动画：高亮父节点
        setNodes(prevNodes =>
          prevNodes.map(node => ({
            ...node,
            className: node.id === step.nodeId ? styles.nodeHighlighted : ''
          }))
        );

        if (settings.isAnimationEnabled) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // 更新整个树结构以反映索引键变化
        updateView();
        break;

      default:
        console.log('未处理的动画步骤类型:', (step as any).type);
    }

    // 动画延迟（根据设置决定）
    if (settings.isAnimationEnabled) {
      await new Promise(resolve => setTimeout(resolve, settings.animationSpeed));
    }

    // 清除高亮效果
    setNodes(prevNodes =>
      prevNodes.map(node => ({
        ...node,
        className: ''
      }))
    );

    setEdges(prevEdges =>
      prevEdges.map(edge => ({
        ...edge,
        className: ''
      }))
    );
  };

  // 插入处理函数
  const handleInsert = async () => {
    if (!validateInput(insertValue)) {
      messageApi.warning('请输入有效的正整数');
      return;
    }

    const key = parseInt(insertValue);
    setError('');
    setIsAnimating(true);

    // 前置校验：检查键是否已存在
    if (bPlusTree.find(key)) {
      messageApi.warning(`键 ${key} 已存在，无法插入。`);
      setIsAnimating(false);
      return;
    }

    try {
      const generator = bPlusTree.insert(key);
      let result = generator.next();

      if (settings.isAnimationEnabled) {
        // 动画模式：逐步执行
        while (!result.done) {
          await executeAnimationStep(result.value);
          result = generator.next();
        }
      } else {
        // 非动画模式：同步执行所有步骤
        while (!result.done) {
          result = generator.next();
        }
        // 直接更新最终状态
        const { nodes: finalNodes, edges: finalEdges } = convertTreeToReactFlow();
        const layoutedFinalNodes = layoutNodes(finalNodes, finalEdges);
        setNodes(layoutedFinalNodes);
        setEdges(finalEdges);
      }

      updateView();
      setInsertValue('');
    } catch (err) {
      messageApi.warning(err instanceof Error ? err.message : '插入失败');
    } finally {
      setIsAnimating(false);
    }
  };

  // 删除处理函数
  const handleDelete = async () => {
    if (!validateInput(deleteValue)) {
      messageApi.warning('请输入有效的正整数');
      return;
    }

    const key = parseInt(deleteValue);
    setError('');
    setIsAnimating(true);

    // 前置校验：检查键是否存在
    if (!bPlusTree.find(key)) {
      messageApi.warning(`键 ${key} 不存在，无法删除。`);
      setIsAnimating(false);
      return;
    }

    try {
      const generator = bPlusTree.delete(key);
      let result = generator.next();

      if (settings.isAnimationEnabled) {
        // 动画模式：逐步执行
        while (!result.done) {
          await executeAnimationStep(result.value);
          result = generator.next();
        }
      } else {
        // 非动画模式：同步执行所有步骤
        while (!result.done) {
          result = generator.next();
        }
        // 直接更新最终状态
        const { nodes: finalNodes, edges: finalEdges } = convertTreeToReactFlow();
        const layoutedFinalNodes = layoutNodes(finalNodes, finalEdges);
        setNodes(layoutedFinalNodes);
        setEdges(finalEdges);
      }

      updateView();
      setDeleteValue('');
    } catch (err) {
      messageApi.warning(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsAnimating(false);
    }
  };

  // 重新渲染（重置）到初始状态
  const handleReset = () => {
    // 重新生成初始树
    bPlusTree.clear();
    initialKeys.forEach(key => {
      if (typeof key === 'number') {
        const generator = bPlusTree.insert(key);
        let result = generator.next();
        while (!result.done) {
          result = generator.next();
        }
      }
    });
    updateView();
    setInsertValue('');
    setDeleteValue('');
    setError('');
    messageApi.success('已重置为初始状态');
  };

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
    <ReactFlowProvider>
      <div className={`${styles['bplus-visualizer']} ${isDarkMode ? styles['dark-mode'] : ''}`}>
        {contextHolder}
        {/* 操作面板 */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          {/* 设置面板 */}
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
          />

          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              B+树操作
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* 插入操作 */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: '250px' }}>
                <TextField
                  label="插入值"
                  value={insertValue}
                  onChange={(e) => setInsertValue(e.target.value)}
                  type="number"
                  size="small"
                  disabled={isAnimating}
                  slotProps={{
                    htmlInput: { min: 1, step: 1 }
                  }}
                  sx={{ width: '120px' }}
                />
                <Button
                  variant="contained"
                  startIcon={isAnimating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                  onClick={handleInsert}
                  disabled={isAnimating || !insertValue}
                  size="small"
                >
                  {isAnimating ? '插入中...' : '插入'}
                </Button>
              </Box>

              {/* 删除操作 */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: '250px' }}>
                <TextField
                  label="删除值"
                  value={deleteValue}
                  onChange={(e) => setDeleteValue(e.target.value)}
                  type="number"
                  size="small"
                  disabled={isAnimating}
                  slotProps={{
                    htmlInput: { min: 1, step: 1 }
                  }}
                  sx={{ width: '120px' }}
                />
                <Button
                  variant="contained"
                  color="error"
                  startIcon={isAnimating ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                  onClick={handleDelete}
                  disabled={isAnimating || !deleteValue}
                  size="small"
                >
                  {isAnimating ? '删除中...' : '删除'}
                </Button>
              </Box>
            </Box>

            {/* 当前键显示 */}
            {bPlusTree.getAllKeys().length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  当前键 ({bPlusTree.getAllKeys().length}个):
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {bPlusTree.getAllKeys().map(key => (
                    <Chip
                      key={key}
                      label={key}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>

        {/* React Flow 画布 */}
        <div className={styles['bplus-canvas-container']}>
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
            <CustomZoomControls onReset={handleReset} />
            <Controls
              className={styles['bplus-controls']}
              showZoom={false}
              showFitView={false}
              showInteractive={true}
            />
            {/* MiniMap 已移除 */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              className={styles['bplus-background']}
            />
          </ReactFlow>
        </div>

        <div className={styles['bplus-info-panel']}>
          <div className={styles['bplus-tree-stats']}>
            <h3>B+树统计信息</h3>
            <p>阶数 (M): {order}</p>
            <p>节点总数: {nodes.length}</p>
            <p>叶子节点: {nodes.filter(n => n.data.isLeaf).length}</p>
            <p>内部节点: {nodes.filter(n => !n.data.isLeaf).length}</p>
            <p>键总数: {bPlusTree.getAllKeys().length}</p>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default BPlusTreeVisualizer;
