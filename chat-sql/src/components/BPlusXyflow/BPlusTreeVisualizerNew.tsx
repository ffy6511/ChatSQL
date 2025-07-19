/**
 * 重构后的B+树可视化组件
 * 基于指令序列的动画系统，实现算法与可视化的完全分离
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  BackgroundVariant,
  ReactFlowProvider,
  Panel,
  MarkerType
} from '@xyflow/react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  RedoOutlined
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useReactFlow } from '@xyflow/react';
import {  Flex } from 'antd';
import {
  Panel as ResizablePanel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

// 导入新的重构组件
import { BPlusTreeAlgorithm } from '../../lib/bplus-tree/algorithm';
import { AnimationManager, AnimationState } from '../../lib/bplus-tree/animationManager';
import { CommandExecutor } from '../../lib/bplus-tree/commandExecutor';
import { BPlusCommand } from '../../lib/bplus-tree/commands';
import { getBPlusTreeStorage, BPlusTreeStorage } from '../../lib/bplus-tree/storage';
import AnimationControls from './AnimationControls';
import BPlusInternalNode from './BPlusInternalNode';
import BPlusLeafNode from './BPlusLeafNode';
import { BPlusNodeData } from '../utils/bPlusTreeToReactFlow';
import styles from './BPlusTreeVisualizer.module.css';
import '@xyflow/react/dist/style.css';

// 自定义节点类型
const nodeTypes = {
  bPlusInternalNode: BPlusInternalNode,
  bPlusLeafNode: BPlusLeafNode,
};

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
  // JS对象的键自动被转化为字符串存储, 因此使用 .map(Number) 转换回数字
  const levels = Object.keys(levelGroups).map(Number).sort((a, b) => b - a);

  levels.forEach((level, levelIndex) => {
    const nodesInLevel = levelGroups[level];

    nodesInLevel.sort((a, b) => {
      // 如果不存在key, 使用Infinity 默认放到最后
      const firstKeyA = a.data.keys.find(k => k !== null) as number | undefined ?? Infinity;
      const firstKeyB = b.data.keys.find(k => k !== null) as number | undefined ?? Infinity;
      return firstKeyA - firstKeyB;
    });

    const logicalSlotWidth = 200; // 为每个节点分配一个固定的"逻辑槽位"宽度
    const levelWidth = nodesInLevel.length * logicalSlotWidth;
    const startX = -levelWidth / 2;

    nodesInLevel.forEach((node, index) => {
      // 计算每个节点在自己的逻辑槽位中的中心X坐标
      const x = startX + index * logicalSlotWidth + logicalSlotWidth / 2;
      const y = levelIndex * 120;

      layoutedNodes.push({
        ...node,
        position: { x, y }
      });
    });
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
          type="button"
          className={styles['bplus-zoom-button']}
          onClick={() => zoomIn({ duration: 800 })}
          aria-label="放大"
        >
          <ZoomInOutlined />
        </button>
      </Tooltip>
      <Tooltip title="缩小" placement="top">
        <button
          type="button"
          className={styles['bplus-zoom-button']}
          onClick={() => zoomOut({ duration: 800 })}
          aria-label="缩小"
        >
          <ZoomOutOutlined />
        </button>
      </Tooltip>
      <Tooltip title="适应视图" placement="top">
        <button
          type="button"
          className={styles['bplus-zoom-button'] + ' ' + styles['bplus-fit-button']}
          onClick={() => fitView({ duration: 800, padding: 0.2 })}
          aria-label="适应视图"
        >
          <FullscreenOutlined />
        </button>
      </Tooltip>
      <Tooltip title="重置为初始状态" placement="top">
        <button
          type="button"
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


// 将B+树转换为React Flow数据
const convertBPlusTreeToFlowData = (algorithm: BPlusTreeAlgorithm, order: number): { nodes: Node<BPlusNodeData>[], edges: Edge[] } => {
  const allNodes = algorithm.getAllNodes();
  const reactFlowNodes: Node<BPlusNodeData>[] = [];
  const reactFlowEdges: Edge[] = [];

  if (allNodes.length === 0) {
    return { nodes: reactFlowNodes, edges: reactFlowEdges };
  }

  allNodes.forEach(node => {
    // 使用节点自身的level属性，如果没有则计算
    let level = node.level;
    if (level === undefined) {
      level = 0;
      let current = node;
      while (current.parent) {
        level++;
        current = current.parent;
      }
    }

    // 准备keys数组，确保长度为order-1
    const nodeKeys = node.keys.slice(0, node.numKeys);
    const paddedKeys = [...nodeKeys, ...Array(Math.max(0, order - 1 - nodeKeys.length)).fill(null)];

    // 准备pointers数组
    let paddedPointers: (string | null)[];
    if (node.isLeaf) {
      // 叶子节点不需要指针
      paddedPointers = Array(order).fill(null);
    } else {
      // 内部节点需要填充子节点的graphicID
      paddedPointers = Array(order).fill(null);
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child, index) => {
          if (child && child.graphicID && index < order) {
            paddedPointers[index] = child.graphicID;
          }
        });
      }
    }

    reactFlowNodes.push({
      id: node.graphicID,
      type: node.isLeaf ? 'bPlusLeafNode' : 'bPlusInternalNode',
      position: { x: 0, y: 0 },
      data: {
        keys: paddedKeys,
        pointers: paddedPointers,
        isLeaf: node.isLeaf,
        level: level,
        order: order,
        next: node.next?.graphicID || null
      }
    });

    // 创建父子关系的边 - 添加严格验证
    if (!node.isLeaf && node.children && Array.isArray(node.children)) {
      node.children.forEach((child, index) => {
        if (child &&
            child.graphicID &&
            node.graphicID &&
            index <= node.numKeys &&
            typeof child.graphicID === 'string' &&
            typeof node.graphicID === 'string' &&
            child.graphicID.trim() !== '' &&
            node.graphicID.trim() !== '') {

          const edgeId = `${node.graphicID}-${child.graphicID}`;
          const sourceHandle = `pointer-${index}`;

          // 确保边ID唯一且有效
          if (!reactFlowEdges.some(edge => edge.id === edgeId)) {
            reactFlowEdges.push({
              id: edgeId,
              source: node.graphicID,
              target: child.graphicID,
              sourceHandle: sourceHandle,
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
        }
      });
    }

    // 叶子节点的兄弟指针 - 添加严格验证
    if (node.isLeaf &&
        node.next &&
        node.next.graphicID &&
        node.graphicID &&
        typeof node.next.graphicID === 'string' &&
        typeof node.graphicID === 'string' &&
        node.next.graphicID.trim() !== '' &&
        node.graphicID.trim() !== '') {

      const edgeId = `${node.graphicID}-next-${node.next.graphicID}`;

      // 确保边ID唯一且有效
      if (!reactFlowEdges.some(edge => edge.id === edgeId)) {
        reactFlowEdges.push({
          id: edgeId,
          source: node.graphicID,
          target: node.next.graphicID,
          sourceHandle: 'sibling',
          targetHandle: 'sibling-target',
          type: 'straight',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
          },
          style: { stroke: 'var(--secondary-text)' }
        });
      }
    }
  });

  return { nodes: reactFlowNodes, edges: reactFlowEdges };
};

interface BPlusTreeVisualizerNewProps {
  initialKeys: (number | string)[];
  order: number;
}

// 设置接口
interface Settings {
  isAnimationEnabled: boolean;
  animationSpeed: number;
  order: number;
}

const BPlusTreeVisualizerNew: React.FC<BPlusTreeVisualizerNewProps> = ({
  initialKeys,
  order
}) => {
  // 状态管理
  const [settings, setSettings] = useState<Settings>({
    isAnimationEnabled: true,
    animationSpeed: 500,
    order: order
  });

  const [insertValue, setInsertValue] = useState<string>('');
  const [deleteValue, setDeleteValue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [storage, setStorage] = useState<BPlusTreeStorage | null>(null);

  // Material-UI消息状态
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // React Flow状态
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BPlusNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 动画系统状态
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    isPaused: false,
    speed: 500
  });

  // Material-UI消息处理函数
  const showMessage = useCallback((message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  // 用 useRef 持久化核心实例
  const bPlusTreeAlgorithmRef = useRef<BPlusTreeAlgorithm | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const commandExecutorRef = useRef<CommandExecutor | null>(null);

  // 初始化核心实例，只在 order 变化时重建
  useEffect(() => {
    bPlusTreeAlgorithmRef.current = new BPlusTreeAlgorithm(order);
    animationManagerRef.current = new AnimationManager();
    commandExecutorRef.current = new CommandExecutor({
      setNodes,
      setEdges,
      showMessage
    });

    // 立即更新视图以显示空树
    setTimeout(() => {
      if (bPlusTreeAlgorithmRef.current) {
        const { nodes: newNodes, edges: newEdges } = convertBPlusTreeToFlowData(
          bPlusTreeAlgorithmRef.current,
          order
        );
        const layoutedNewNodes = layoutNodes(newNodes, newEdges);
        setNodes(layoutedNewNodes);
        setEdges(newEdges);
      }
    }, 0);
  }, [order, setNodes, setEdges, showMessage]);

  // 动画管理器回调
  useEffect(() => {
    if (!animationManagerRef.current || !commandExecutorRef.current) return;
    animationManagerRef.current.setCallbacks({
      onStepChange: async (step, command) => {
        if (command) {
          await commandExecutorRef.current!.executeCommand(command);
        }
      },
      onStateChange: (state) => {
        setAnimationState(state);
        setIsAnimating(state.isPlaying);
      },
      onComplete: () => {
        showMessage('动画播放完成', 'success');
        setIsAnimating(false);
      },
      onError: (error) => {
        showMessage(`动画执行错误: ${error.message}`, 'error');
        setIsAnimating(false);
        setError(error.message);
      }
    });
    animationManagerRef.current.setSpeed(settings.animationSpeed);
  }, [settings.animationSpeed, showMessage]);

  // 初始化存储
  useEffect(() => {
    const initStorage = async () => {
      try {
        const storageInstance = await getBPlusTreeStorage();
        setStorage(storageInstance);

        // 尝试加载自动保存的数据
        const autoSaveData = await storageInstance.loadAutoSave();
        if (autoSaveData && autoSaveData.keys.length > 0) {
          // 如果有自动保存的数据且没有初始键值，则使用自动保存的数据
          if (initialKeys.length === 0) {
            // 这里可以考虑询问用户是否要恢复自动保存的数据
            console.log('Found auto-saved data:', autoSaveData);
          }
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        showMessage('存储初始化失败', 'warning');
      }
    };

    initStorage();
  }, [initialKeys.length, showMessage]);

  // 更新视图函数 - 移除setNodes和setEdges依赖避免无限循环
  const updateView = useCallback(() => {
    if (!bPlusTreeAlgorithmRef.current) return;

    try {
      const { nodes: newNodes, edges: newEdges } = convertBPlusTreeToFlowData(
        bPlusTreeAlgorithmRef.current,
        settings.order
      );

      // 验证节点和边数据的有效性
      const validNodes = newNodes.filter(node =>
        node.id &&
        typeof node.id === 'string' &&
        node.id.trim() !== ''
      );

      const validEdges = newEdges.filter(edge =>
        edge.id &&
        edge.source &&
        edge.target &&
        typeof edge.id === 'string' &&
        typeof edge.source === 'string' &&
        typeof edge.target === 'string' &&
        edge.id.trim() !== '' &&
        edge.source.trim() !== '' &&
        edge.target.trim() !== ''
      );

      const layoutedNewNodes = layoutNodes(validNodes, validEdges);
      setNodes(layoutedNewNodes);
      setEdges(validEdges);
    } catch (error) {
      console.error('Error updating view:', error);
      showMessage('视图更新失败', 'error');
    }
  }, [settings.order, showMessage]);

  // 自动保存函数
  const autoSave = useCallback(async () => {
    if (!storage || !bPlusTreeAlgorithmRef.current) return;

    try {
      const keys = bPlusTreeAlgorithmRef.current.getAllKeys();
      await storage.autoSave(settings.order, keys);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [storage, settings.order]);

  // 初始化B+树
  useEffect(() => {
    const initializeTree = async () => {
      if (!bPlusTreeAlgorithmRef.current) return;

      // 清空树
      bPlusTreeAlgorithmRef.current.clear();
      commandExecutorRef.current?.reset();

      // 插入初始键值
      for (const key of initialKeys) {
        if (typeof key === 'number') {
          const commands = bPlusTreeAlgorithmRef.current.insertElement(key);
          if (!settings.isAnimationEnabled) {
            await commandExecutorRef.current!.executeCommands(commands);
          }
        }
      }

      // 总是更新视图，即使没有初始键值
      updateView();
    };

    // 延迟执行以确保所有引用都已初始化
    setTimeout(() => {
      initializeTree();
    }, 100);
  }, [initialKeys, order, settings.isAnimationEnabled, updateView]);

  // 输入验证 - 支持正负整数和0
  const validateInput = (value: string): boolean => {
    if (value === '' || value === '-') return false;
    const num = parseInt(value);
    return !isNaN(num) && Number.isInteger(num) && num >= -999999 && num <= 999999;
  };

  // 插入处理函数
  const handleInsert = async () => {
    if (!validateInput(insertValue)) {
      showMessage('插入失败：请输入有效的整数（支持正负数和0）', 'warning');
      return;
    }
    const key = parseInt(insertValue);
    setError('');

    // 检查键值是否已存在

    if (bPlusTreeAlgorithmRef.current!.find(key)) {
      showMessage(`插入失败：键值 ${key} 已存在于树中`, 'warning');
      return;
    }
    try {
      const commands = bPlusTreeAlgorithmRef.current!.insertElement(key);
      if (settings.isAnimationEnabled) {
        setIsAnimating(true);
        animationManagerRef.current!.loadCommands(commands);

        // 设置动画完成回调，保留onStepChange
        animationManagerRef.current!.setCallbacks({
          onStepChange: async (_step, command) => {
            if (command) {
              await commandExecutorRef.current!.executeCommand(command);
            }
          },
          onComplete: () => {
            setIsAnimating(false);
            updateView();
            autoSave();
            showMessage(`成功插入键 ${key}`, 'success');
          },
          onError: (error) => {
            setIsAnimating(false);
            showMessage(error.message, 'error');
          }
        });

        await animationManagerRef.current!.playAll();
      } else {
        // 非动画模式：直接执行命令序列
        await commandExecutorRef.current!.executeCommands(commands);
        updateView(); // 更新视图
        autoSave(); // 自动保存
        showMessage(`成功插入键 ${key}`, 'success');
      }
      setInsertValue('');
    } catch (error) {
      setIsAnimating(false);
      const errorMessage = error instanceof Error ? error.message : '插入操作失败，请重试';
      setError(errorMessage);
      showMessage(`插入失败：${errorMessage}`, 'error');
    }
  };

  // 删除处理函数
  const handleDelete = async () => {
    if (!validateInput(deleteValue)) {
      showMessage('删除失败：请输入有效的整数（支持正负数和0）', 'warning');
      return;
    }

    const key = parseInt(deleteValue);
    setError('');

    // 检查键值是否存在
    const allKeys = bPlusTreeAlgorithmRef.current!.getAllKeys();
    const keyExists = bPlusTreeAlgorithmRef.current!.find(key);

    if (!keyExists) {
      const keysDisplay = allKeys.length > 0 ? `[${allKeys.join(', ')}]` : '空树';
      showMessage(`删除失败：键值 ${key} 不存在。当前树中的键值：${keysDisplay}`, 'warning');
      return;
    }

    try {
      const commands = bPlusTreeAlgorithmRef.current!.deleteElement(key);

      if (settings.isAnimationEnabled) {
        setIsAnimating(true);
        animationManagerRef.current!.loadCommands(commands);

        // 设置动画完成回调，保留onStepChange
        animationManagerRef.current!.setCallbacks({
          onStepChange: async (_step, command) => {
            if (command) {
              await commandExecutorRef.current!.executeCommand(command);
            }
          },
          onComplete: () => {
            setIsAnimating(false);
            updateView();
            autoSave();
            showMessage(`成功删除键 ${key}`, 'success');
          },
          onError: (error) => {
            setIsAnimating(false);
            showMessage(error.message, 'error');
          }
        });

        await animationManagerRef.current!.playAll();
      } else {
        // 非动画模式：直接执行命令序列
        await commandExecutorRef.current!.executeCommands(commands);
        updateView(); // 更新视图
        autoSave(); // 自动保存
        showMessage(`成功删除键 ${key}`, 'success');
      }

      setDeleteValue('');
    } catch (error) {
      setIsAnimating(false);
      const errorMessage = error instanceof Error ? error.message : '删除操作失败，请重试';
      setError(errorMessage);
      showMessage(`删除失败：${errorMessage}`, 'error');
    }
  };

  // 重置处理函数
  const handleReset = () => {
    animationManagerRef.current!.stop();
    commandExecutorRef.current!.reset();
    bPlusTreeAlgorithmRef.current!.clear();
    updateView(); // 更新视图
    autoSave(); // 自动保存
    setInsertValue('');
    setDeleteValue('');
    setError('');
    showMessage('B+树已重置', 'info');
  };

  // 动画控制函数 - 适配XyFlow
  const handlePlay = async () => {
    if (!animationManagerRef.current) return;

    setIsAnimating(true);
    animationManagerRef.current.setCallbacks({
      onStepChange: async (_step, command) => {
        if (command) {
          await commandExecutorRef.current!.executeCommand(command);
        }
      },
      onComplete: () => {
        setIsAnimating(false);
        updateView();
      },
      onError: (error) => {
        setIsAnimating(false);
        showMessage(error.message, 'error');
      }
    });

    await animationManagerRef.current.playAll();
  };

  const handlePause = () => {
    animationManagerRef.current?.pause();
  };

  const handleStop = () => {
    animationManagerRef.current?.stop();
    setIsAnimating(false);
    updateView();
  };

  const handleStepForward = async () => {
    if (!animationManagerRef.current) return;

    await animationManagerRef.current.stepForward();
    updateView();
  };

  const handleStepBackward = async () => {
    if (!animationManagerRef.current) return;

    await animationManagerRef.current.stepBackward();
    updateView();
  };

  const handleJumpToStep = async (step: number) => {
    if (!animationManagerRef.current) return;

    await animationManagerRef.current.jumpToStep(step);
    updateView();
  };

  const handleSpeedChange = (speed: number) => {
    animationManagerRef.current?.setSpeed(speed);
    setSettings(prev => ({ ...prev, animationSpeed: speed }));
  };

  const handleAnimationReset = () => {
    animationManagerRef.current?.reset();
    setIsAnimating(false);
    updateView();
  };

  const handleJumpToNextBreakpoint = async () => {
    if (!animationManagerRef.current) return;

    await animationManagerRef.current.jumpToNextBreakpoint();
    updateView();
  };

  const handleJumpToPreviousBreakpoint = async () => {
    if (!animationManagerRef.current) return;

    await animationManagerRef.current.jumpToPreviousBreakpoint();
    updateView();
  };

  // 手动保存功能
  const handleManualSave = async () => {
    if (!storage || !bPlusTreeAlgorithmRef.current) {
      showMessage('存储未初始化', 'error');
      return;
    }

    try {
      const keys = bPlusTreeAlgorithmRef.current.getAllKeys();
      const id = storage.generateId();
      const name = `B+树-${new Date().toLocaleString()}`;

      await storage.saveTree({
        id,
        name,
        order: settings.order,
        keys
      });

      showMessage(`已保存为: ${name}`, 'success');
    } catch (error) {
      showMessage('保存失败', 'error');
    }
  };

  // 恢复自动保存功能
  const handleRestoreAutoSave = async () => {
    if (!storage || !bPlusTreeAlgorithmRef.current) {
      showMessage('存储未初始化', 'error');
      return;
    }

    try {
      const autoSaveData = await storage.loadAutoSave();
      if (!autoSaveData || autoSaveData.keys.length === 0) {
        showMessage('没有找到自动保存的数据', 'info');
        return;
      }

      // 清空当前树
      bPlusTreeAlgorithmRef.current.clear();
      commandExecutorRef.current!.reset();

      // 插入保存的键值 - 确保类型转换正确
      for (const key of autoSaveData.keys) {
        // keys已经定义为number[]，但为了安全起见进行类型检查
        if (typeof key === 'number' && !isNaN(key)) {
          const commands = bPlusTreeAlgorithmRef.current.insertElement(key);
          if (!settings.isAnimationEnabled) {
            await commandExecutorRef.current!.executeCommands(commands);
          }
        }
      }

      updateView();
      showMessage(`已恢复自动保存的数据 (${autoSaveData.keys.length} 个键值)`, 'success');
    } catch (error) {
      showMessage('恢复失败', 'error');
    }
  };

  // 获取断点位置
  const breakpoints = animationManagerRef.current?.getStepBreakpoints() ?? [];

  // Snackbar关闭处理函数
  const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <ReactFlowProvider>
      <PanelGroup direction="vertical" style={{ height: "100vh" }}>
        {/* 上面：动画控制和操作面板 */}
        <ResizablePanel minSize={20} maxSize={70} defaultSize={30}>
          <Box sx={{ height: "100%", overflow: "auto", p: 2 }}>
            {/* 动画控制面板 */}
            {settings.isAnimationEnabled && (
              <Box sx={{ mb: 1 }}>
                <AnimationControls
                  animationState={animationState}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onStop={handleStop}
                  onStepForward={handleStepForward}
                  onStepBackward={handleStepBackward}
                  onJumpToStep={handleJumpToStep}
                  onSpeedChange={handleSpeedChange}
                  onReset={handleAnimationReset}
                  onJumpToNextBreakpoint={handleJumpToNextBreakpoint}
                  onJumpToPreviousBreakpoint={handleJumpToPreviousBreakpoint}
                  breakpoints={breakpoints}
                  disabled={false}
                />
              </Box>
            )}
          </Box>
        </ResizablePanel>

        {/* 拖拽手柄 */}
        <PanelResizeHandle style={{ height: 6, background: "#eee", cursor: "row-resize" }} />

        {/* 下面：React Flow 画布 */}
        <ResizablePanel minSize={30} defaultSize={70}>
          <Box
            sx={{
              height: "100%",
              width: "100%",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0, // 关键，防止子元素撑破
            }}
          >
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
              style={{ width: "100%", height: "100%" }}
            >
              <Controls
                showZoom
                showFitView
                showInteractive
                position="bottom-right"
                style={{ right: 16, bottom: 16 }}
              />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              {/* B+树操作面板 */}
              <Panel position="top-left">
                <Paper elevation={2} sx={{ p: 2, minWidth: '200px', maxWidth: '300px' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    B+树操作
                  </Typography>

                  {/* 阶数设置 */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      阶数设置
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.order}
                      onChange={(e) => {
                        const newOrder = parseInt(e.target.value);
                        if (newOrder >= 3 && newOrder <= 10) {
                          setSettings(prev => ({ ...prev, order: newOrder }));
                        }
                      }}
                      size="small"
                      slotProps={{
                        htmlInput: { min: 3, max: 10, step: 1 }
                      }}
                      sx={{ width: '80px' }}
                      disabled={isAnimating}
                    />
                  </Box>

                  {/* 动画开关控制 */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      动画设置
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.isAnimationEnabled}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSettings(prev => ({ ...prev, isAnimationEnabled: e.target.checked }));
                          }}
                          disabled={isAnimating}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: 'var(--secondary-text)' }}>
                          {settings.isAnimationEnabled ? '启用动画' : '禁用动画'}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* 插入操作 */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        label="插入值"
                        value={insertValue}
                        onChange={(e) => setInsertValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                        type="number"
                        size="small"
                        disabled={isAnimating}
                        error={insertValue !== '' && !validateInput(insertValue)}
                        helperText={insertValue !== '' && !validateInput(insertValue) ? '请输入有效的整数（支持正负数和0）' : ''}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleInsert}
                        disabled={isAnimating || !validateInput(insertValue)}
                        size="small"
                      >
                        插入
                      </Button>
                    </Box>

                    {/* 删除操作 */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        label="删除值"
                        value={deleteValue}
                        onChange={(e) => setDeleteValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                        type="number"
                        size="small"
                        disabled={isAnimating}
                        error={deleteValue !== '' && !validateInput(deleteValue)}
                        helperText={deleteValue !== '' && !validateInput(deleteValue) ? '请输入有效的整数（支持正负数和0）' : ''}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                        disabled={isAnimating || !validateInput(deleteValue)}
                        size="small"
                      >
                        删除
                      </Button>
                    </Box>

                    {/* 重置按钮 */}
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      disabled={isAnimating}
                      size="small"
                    >
                      重置
                    </Button>

                    {/* 存储功能按钮 */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={handleManualSave}
                        disabled={isAnimating}
                        size="small"
                        color="primary"
                      >
                        保存
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<LoadIcon />}
                        onClick={handleRestoreAutoSave}
                        disabled={isAnimating}
                        size="small"
                        color="secondary"
                      >
                        恢复
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Panel>
            </ReactFlow>
          </Box>
        </ResizablePanel>
      </PanelGroup>

      {/* Snackbar 消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        sx={{ ml: 5 }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ReactFlowProvider>
  );
};

export default BPlusTreeVisualizerNew;
