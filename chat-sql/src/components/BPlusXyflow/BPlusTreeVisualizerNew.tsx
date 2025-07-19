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
  Panel
} from '@xyflow/react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
import AnimationControls from './AnimationControls';
import BPlusInternalNode from './BPlusInternalNode';
import BPlusLeafNode from './BPlusLeafNode';
import { BPlusNodeData } from '../utils/bPlusTreeToReactFlow';
import '@xyflow/react/dist/style.css';

// 自定义节点类型
const nodeTypes = {
  bPlusInternalNode: BPlusInternalNode,
  bPlusLeafNode: BPlusLeafNode,
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

  // 初始化B+树
  useEffect(() => {
    const initializeTree = async () => {
      commandExecutorRef.current?.reset();
      // 插入初始键值
      for (const key of initialKeys) {
        if (typeof key === 'number') {
          const commands = bPlusTreeAlgorithmRef.current!.insertElement(key);
          if (!settings.isAnimationEnabled) {
            await commandExecutorRef.current!.executeCommands(commands);
          }
        }
      }
    };
    initializeTree();
  }, [initialKeys, order, settings.isAnimationEnabled]);

  // 输入验证
  const validateInput = (value: string): boolean => {
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && num <= 999;
  };

  // 插入处理函数
  const handleInsert = async () => {
    if (!validateInput(insertValue)) {
      showMessage('请输入有效的正整数（1-999）', 'warning');
      return;
    }
    const key = parseInt(insertValue);
    setError('');
    if (bPlusTreeAlgorithmRef.current!.find(key)) {
      showMessage(`键 ${key} 已存在，无法插入`, 'warning');
      return;
    }
    try {
      const commands = bPlusTreeAlgorithmRef.current!.insertElement(key);
      if (settings.isAnimationEnabled) {
        animationManagerRef.current!.loadCommands(commands);
        await animationManagerRef.current!.playAll();
      } else {
        await commandExecutorRef.current!.executeCommands(commands);
        showMessage(`成功插入键 ${key}`, 'success');
      }
      setInsertValue('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '插入失败';
      setError(errorMessage);
      showMessage(errorMessage, 'error');
    }
  };

  // 删除处理函数
  const handleDelete = async () => {
    if (!validateInput(deleteValue)) {
      showMessage('请输入有效的正整数（1-999）', 'warning');
      return;
    }

    const key = parseInt(deleteValue);
    setError('');

    if (!bPlusTreeAlgorithmRef.current!.find(key)) {
      showMessage(`键 ${key} 不存在，无法删除`, 'warning');
      return;
    }

    try {
      const commands = bPlusTreeAlgorithmRef.current!.deleteElement(key);
      
      if (settings.isAnimationEnabled) {
        animationManagerRef.current!.loadCommands(commands);
        await animationManagerRef.current!.playAll();
      } else {
        await commandExecutorRef.current!.executeCommands(commands);
        showMessage(`成功删除键 ${key}`, 'success');
      }

      setDeleteValue('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除失败';
      setError(errorMessage);
      showMessage(errorMessage, 'error');
    }
  };

  // 重置处理函数
  const handleReset = () => {
    animationManagerRef.current!.stop();
    commandExecutorRef.current!.reset();
    bPlusTreeAlgorithmRef.current!.clear();
    setInsertValue('');
    setDeleteValue('');
    setError('');
    showMessage('B+树已重置', 'info');
  };

  // 动画控制函数
  const handlePlay = () => animationManagerRef.current!.playAll();
  const handlePause = () => animationManagerRef.current!.pause();
  const handleStop = () => animationManagerRef.current!.stop();
  const handleStepForward = () => animationManagerRef.current!.stepForward();
  const handleStepBackward = () => animationManagerRef.current!.stepBackward();
  const handleJumpToStep = (step: number) => animationManagerRef.current!.jumpToStep(step);
  const handleSpeedChange = (speed: number) => {
    animationManagerRef.current!.setSpeed(speed);
    setSettings(prev => ({ ...prev, animationSpeed: speed }));
  };
  const handleAnimationReset = () => animationManagerRef.current!.reset();
  const handleJumpToNextBreakpoint = () => animationManagerRef.current!.jumpToNextBreakpoint();
  const handleJumpToPreviousBreakpoint = () => animationManagerRef.current!.jumpToPreviousBreakpoint();

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
                        helperText={insertValue !== '' && !validateInput(insertValue) ? '请输入1-999的整数' : ''}
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
                        helperText={deleteValue !== '' && !validateInput(deleteValue) ? '请输入1-999的整数' : ''}
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
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ReactFlowProvider>
  );
};

export default BPlusTreeVisualizerNew;
