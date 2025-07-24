'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import BPlusTreeVisualizer, { TreeState, BPlusTreeOperations } from '@/components/BPlusXyflow/BPlusTreeVisualizer';
import BPlusOperationPanel from '@/components/BPlusXyflow/BPlusOperationPanel';
import HistoryManagementPanel from '@/components/BPlusHistory/HistoryManagementPanel';
import ChatReservedArea from '@/components/BPlusHistory/ChatReservedArea';
import BPlusSidebar from '@/components/BPlusHistory/BPlusSidebar';
import NewSessionModal, { NewSessionFormData } from '@/components/BPlusHistory/NewSessionModal';
import ClearAllConfirmDialog from '@/components/BPlusHistory/ClearAllConfirmDialog';
import { HistorySession, HistoryStep } from '@/types/bPlusHistory';
import Typography from '@mui/material/Typography';
import { getBPlusHistoryStorage, BPlusHistoryStorage } from '@/lib/bplus-tree/historyStorage';
import '@/styles/globalSidebar.css';

/**
 * B+树操作历史页面 - 支持版本控制与回溯功能
 * 采用左右布局：左侧历史管理面板，右侧分为上下两部分（B+树渲染区域和操作控制区域）
 */
const BPlusHistoryPage: React.FC = () => {
  // B+树状态管理
  const [currentTreeState, setCurrentTreeState] = useState<TreeState | null>({
    nodes: [],
    edges: [],
    keys: [],
    timestamp: Date.now(),
    operation: 'initial',
  });
  const [order, setOrder] = useState<number>(3);
  const [isAnimating, setIsAnimating] = useState<boolean>(false); // 添加动画状态



  // 历史管理状态
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>();
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [currentSession, setCurrentSession] = useState<HistorySession | null>(null);

  // 新建会话模态框状态
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState<boolean>(false);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);

  // 清理确认对话框状态
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  // B+树操作接口
  const [treeOperations, setTreeOperations] = useState<BPlusTreeOperations | null>(null);

  // 历史存储服务
  const [historyStorage, setHistoryStorage] = useState<BPlusHistoryStorage | null>(null);
  const [allSessions, setAllSessions] = useState<HistorySession[]>([]);



  // 操作面板设置状态
  const [operationSettings, setOperationSettings] = useState({
    isAnimationEnabled: true,
    animationSpeed: 500,
    order: order
  });

  // 消息状态
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 消息处理函数
  const showMessage = useCallback((message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  // B+树状态变更处理
  const handleTreeStateChange = useCallback(async (state: TreeState) => {
    setCurrentTreeState(state);

    // 如果没有当前会话，则不记录历史
    if (!currentSession || !historyStorage) {
      return;
    }

    // 创建新的历史步骤
    const newStep: HistoryStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      operation: state.operation || 'initial',
      key: state.operationKey,
      timestamp: state.timestamp,
      nodes: [...state.nodes],
      edges: [...state.edges],
      keys: [...state.keys],
      description: getOperationDescription(state.operation, state.operationKey),
      success: true
    };

    try {
      // 1. 添加步骤到存储
      await historyStorage.addStep(currentSession.id, newStep);

      // 2. 获取更新后的会话并更新当前会话状态
      const updatedSession = await historyStorage.getSession(currentSession.id);
      if (updatedSession) {
        setCurrentSession(updatedSession);

        // 4. 自动选中新添加的步骤（最后一个步骤）
        const newStepIndex = updatedSession.steps.length - 1;
        setSelectedStepIndex(newStepIndex);
      }

      // 3. 手动更新所有会话列表
      const updatedSessions = await historyStorage.getAllSessions();
      setAllSessions(updatedSessions);

    } catch (error) {
      console.error('Failed to save step to storage:', error);
      showMessage('无法保存操作步骤', 'error');
    }
  }, [currentSession, historyStorage, showMessage]);

  // 获取操作描述
  const getOperationDescription = (operation?: string, key?: number): string => {
    switch (operation) {
      case 'insert':
        return `插入键值 ${key}`;
      case 'delete':
        return `删除键值 ${key}`;
      case 'reset':
        return '重置B+树';
      case 'initial':
        return '初始化B+树';
      default:
        return '未知操作';
    }
  };

  // 历史管理回调函数
  const handleSessionSelect = useCallback(async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedStepIndex(undefined);

    if (!historyStorage) {
      showMessage('历史存储服务未初始化', 'error');
      return;
    }

    try {
      // 从存储中加载会话数据
      const session = await historyStorage.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
        // 如果会话有步骤，加载最后一个步骤的状态并自动选中最后一步
        if (session.steps.length > 0) {
          const lastStepIndex = session.steps.length - 1;
          const lastStep = session.steps[lastStepIndex];

          // 设置选中的步骤索引为最后一步
          setSelectedStepIndex(lastStepIndex);

          setCurrentTreeState({
            nodes: lastStep.nodes,
            edges: lastStep.edges,
            keys: lastStep.keys,
            operation: lastStep.operation,
            operationKey: lastStep.key,
            timestamp: lastStep.timestamp
          });
        } else {
          // 如果新会话没有步骤，则重置为初始空状态，以防止状态污染
          setCurrentTreeState({
            nodes: [],
            edges: [],
            keys: [],
            operation: 'initial',
            timestamp: Date.now()
          });
        }
        showMessage(`已选择会话: ${session.name}`, 'info');
      } else {
        showMessage('会话不存在', 'error');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      showMessage('加载会话失败', 'error');
    }
  }, [historyStorage, showMessage]);

  const handleStepSelect = useCallback((stepIndex: number) => {
    setSelectedStepIndex(stepIndex);

    // 历史回溯：根据选中的步骤更新B+树状态
    if (currentSession && currentSession.steps[stepIndex]) {
      const selectedStep = currentSession.steps[stepIndex];
      const newTreeState: TreeState = {
        nodes: [...selectedStep.nodes],
        edges: [...selectedStep.edges],
        keys: [...selectedStep.keys],
        operation: selectedStep.operation,
        operationKey: selectedStep.key,
        timestamp: selectedStep.timestamp
      };
      setCurrentTreeState(newTreeState);
      showMessage(`已回溯到步骤: ${stepIndex + 1} - ${selectedStep.description}`, 'info');
    } else {
      showMessage(`已选择步骤: ${stepIndex + 1}`, 'info');
    }
  }, [showMessage, currentSession]);

  // 打开新建会话模态框
  const handleOpenNewSessionModal = useCallback(() => {
    setIsNewSessionModalOpen(true);
  }, []);

  // 关闭新建会话模态框
  const handleCloseNewSessionModal = useCallback(() => {
    setIsNewSessionModalOpen(false);
    setIsCreatingSession(false);
  }, []);

  // 创建新会话
  const handleCreateSession = useCallback(async (formData: NewSessionFormData) => {
    setIsCreatingSession(true);

    try {
      if (!historyStorage) {
        showMessage('历史存储服务未初始化', 'error');
        return;
      }

      // 使用存储服务创建会话
      const sessionId = await historyStorage.createSession({
        name: formData.name,
        order: formData.order,
        steps: [],
        currentStepIndex: -1,
        description: formData.description || '新建的B+树操作会话',
        tags: formData.tags || ['新建'],
        isCompleted: false
      });

      // 获取创建的会话
      const newSession = await historyStorage.getSession(sessionId);
      if (!newSession) {
        throw new Error('创建会话后无法获取会话数据');
      }

      // 更新本地状态
      setCurrentSession(newSession);
      setSelectedSessionId(newSession.id);
      setCurrentTreeState(null); // 重置树状态
      setOrder(formData.order); // 设置新的阶数

      // 手动更新会话列表
      const updatedSessions = await historyStorage.getAllSessions();
      setAllSessions(updatedSessions);

      // 关闭模态框
      setIsNewSessionModalOpen(false);
      showMessage(`已创建新会话: ${newSession.name}`, 'success');
    } catch (error) {
      console.error('创建会话失败:', error);
      showMessage('创建会话失败，请重试', 'error');
    } finally {
      setIsCreatingSession(false);
    }
  }, [historyStorage, showMessage]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!historyStorage) {
      showMessage('历史存储服务未初始化', 'error');
      return;
    }

    try {
      // 从存储中删除会话
      await historyStorage.deleteSession(sessionId);

      // 手动更新会话列表
      const updatedSessions = await historyStorage.getAllSessions();
      setAllSessions(updatedSessions);

      // 如果删除的是当前选中的会话，清除选中状态
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(undefined);
        setCurrentSession(null);
        setCurrentTreeState(null);
      }

      showMessage('会话已删除', 'success');
    } catch (error) {
      console.error('删除会话失败:', error);
      showMessage('删除会话失败，请重试', 'error');
    }
  }, [historyStorage, selectedSessionId, showMessage]);

  const handleRenameSession = useCallback(async (sessionId: string, newName: string) => {
    if (!historyStorage) {
      showMessage('历史存储服务未初始化', 'error');
      return;
    }

    try {
      // 更新会话名称
      await historyStorage.updateSession(sessionId, { name: newName });

      // 手动更新会话列表
      const updatedSessions = await historyStorage.getAllSessions();
      setAllSessions(updatedSessions);

      // 如果是当前会话，更新当前会话状态
      if (currentSession && currentSession.id === sessionId) {
        const updatedSession = await historyStorage.getSession(sessionId);
        if (updatedSession) {
          setCurrentSession(updatedSession);
        }
      }

      showMessage(`会话已重命名为: ${newName}`, 'success');
    } catch (error) {
      console.error('重命名会话失败:', error);
      showMessage('重命名会话失败，请重试', 'error');
    }
  }, [historyStorage, currentSession, showMessage]);

  // 打开清理确认对话框
  const handleOpenClearAllDialog = useCallback(() => {
    setIsClearAllDialogOpen(true);
  }, []);

  // 关闭清理确认对话框
  const handleCloseClearAllDialog = useCallback(() => {
    setIsClearAllDialogOpen(false);
    setIsClearingAll(false);
  }, []);

  // 确认清理所有会话
  const handleDeleteAllSessions = useCallback(async () => {
    setIsClearingAll(true);

    try {
      if (!historyStorage) {
        showMessage('历史存储服务未初始化', 'error');
        return;
      }

      // 清理所有会话数据
      const sessions = await historyStorage.getAllSessions();
      for (const session of sessions) {
        await historyStorage.deleteSession(session.id);
      }

      // 更新本地状态
      setCurrentSession(null);
      setSelectedSessionId(undefined);
      setSelectedStepIndex(undefined);
      setCurrentTreeState(null);
      setAllSessions([]);

      // 关闭对话框
      setIsClearAllDialogOpen(false);
      showMessage('已清理所有历史记录', 'success');
    } catch (error) {
      console.error('清理历史记录失败:', error);
      showMessage('清理历史记录失败，请重试', 'error');
    } finally {
      setIsClearingAll(false);
    }
  }, [historyStorage, showMessage]);

  // 处理B+树操作接口就绪
  const handleOperationsReady = useCallback((operations: BPlusTreeOperations) => {
    setTreeOperations(operations);
  }, []);

  // 处理动画状态变更
  const handleAnimationStateChange = useCallback((animating: boolean) => {
    setIsAnimating(animating);
  }, []);

  // 初始化历史存储服务
  useEffect(() => {
    const initHistoryStorage = async () => {
      try {
        const storage = await getBPlusHistoryStorage();
        setHistoryStorage(storage);

        // 加载所有会话
        const sessions = await storage.getAllSessions();
        setAllSessions(sessions);
      } catch (error) {
        console.error('Failed to initialize history storage:', error);
        showMessage('历史存储初始化失败', 'error');
      }
    };

    initHistoryStorage();
  }, [showMessage]);

  // 操作面板设置变更处理
  const handleOperationSettingsChange = useCallback((newSettings: typeof operationSettings) => {
    setOperationSettings(newSettings);
    // 如果阶数变更，同时更新主状态
    if (newSettings.order !== order) {
      setOrder(newSettings.order);
    }
  }, [order]);

  // 操作面板的操作处理函数
  const handleOperationInsert = useCallback(async (value: number) => {
    if (treeOperations) {
      await treeOperations.insert(value);
    }
  }, [treeOperations]);

  const handleOperationDelete = useCallback(async (value: number) => {
    if (treeOperations) {
      await treeOperations.delete(value);
    }
  }, [treeOperations]);

  const handleOperationReset = useCallback(() => {
    if (treeOperations) {
      treeOperations.reset();
    }
  }, [treeOperations]);

  // 保存和恢复功能的占位符实现
  const handleOperationSave = useCallback(async () => {
    showMessage('保存功能暂未实现', 'info');
  }, [showMessage]);

  const handleOperationRestore = useCallback(async () => {
    showMessage('恢复功能暂未实现', 'info');
  }, [showMessage]);

  // 对话框回调函数
  const handleSendMessage = useCallback((message: string) => {
    showMessage(`发送消息: ${message}`, 'info');
  }, [showMessage]);

  const handleGetHelp = useCallback(() => {
    showMessage('获取帮助功能开发中...', 'info');
  }, [showMessage]);

  const handleGetSuggestion = useCallback(() => {
    showMessage('获取建议功能开发中...', 'info');
  }, [showMessage]);

  // 历史记录切换处理
  const handleToggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
    showMessage(!showHistory ? '已显示历史记录区域' : '已隐藏历史记录区域', 'info');
  }, [showHistory, showMessage]);

  // Snackbar关闭处理
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <Box
      className = "pageContainer"
      sx={{
      width: '100vw',
      display: 'flex',
      bgcolor: 'var(--background-color)',
      overflow: 'hidden',
    }}>

      {/* 侧边栏 */}
      <Box sx={{ flexShrink: 0 }}>
        <BPlusSidebar
          showHistory={showHistory}
          onToggleHistory={handleToggleHistory}
          onNewRecord={handleOpenNewSessionModal}
        />
      </Box>

      {/* 可拖拽的面板组实现两栏布局 */}
      <PanelGroup direction="horizontal" style={{ height: "100vh", flex: 1 }}>

        {/* 左侧：历史管理面板（条件显示） */}
        {showHistory && (
          <>
            <Panel minSize={15} maxSize={40} defaultSize={20}>
          <Box sx={{
            height: "100%",
            p: 0,
            bgcolor: 'var(--background-color)',
            borderRight: '1px solid var(--card-border)',
            overflow: 'hidden'
          }}>
            <HistoryManagementPanel
              selectedSessionId={selectedSessionId}
              selectedStepIndex={selectedStepIndex}
              sessions={allSessions}
              onSessionSelect={handleSessionSelect}
              onStepSelect={handleStepSelect}
              onCreateSession={handleOpenNewSessionModal}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
              onDeleteAllSessions={handleOpenClearAllDialog}
            />
          </Box>
        </Panel>

        {/* 拖拽手柄 */}
        <PanelResizeHandle style={{
          width: 2,
          background: "var(--card-border)",
          cursor: "col-resize",
          transition: "background-color 0.2s ease"
        }} />
        </>
        )}

        {/* 右侧：B+树可视化和操作区域 */}
        <Panel minSize={50} defaultSize={75}>
          <PanelGroup direction="vertical" style={{ height: "100%" }}>
            
            {/* 上部分：B+树渲染区域 */}
            <Panel minSize={40} defaultSize={65}>
              <Box sx={{ 
                height: "100%", 
                position: "relative",
                bgcolor: 'var(--background-color)'
              }}>
                <BPlusTreeVisualizer
                  // 使用key来强制重新挂载组件，确保状态隔离
                  key={selectedSessionId ? `${selectedSessionId}-${selectedStepIndex}` : 'initial-session'}
                  order={order}
                  initialState={currentTreeState || undefined}
                  onStateChange={handleTreeStateChange}
                  onOperationsReady={handleOperationsReady}
                  onAnimationStateChange={handleAnimationStateChange}
                  // 传递动画设置
                  isAnimationEnabled={operationSettings.isAnimationEnabled}
                  animationSpeed={operationSettings.animationSpeed}
                />
              </Box>
            </Panel>

            {/* 拖拽手柄 */}
            <PanelResizeHandle style={{ 
              height: 2, 
              background: "var(--card-border)", 
              cursor: "row-resize",
              transition: "background-color 0.2s ease"
            }} />

            {/* 下部分：操作面板和对话区域 */}
            <Panel minSize={20} defaultSize={35}>
              <PanelGroup direction="horizontal" style={{ height: "100%" }}>

                {/* 左侧：操作面板 */}
                <Panel minSize={25} defaultSize={40}>
                  <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
                    {/* 当没有会话时显示遮罩层 */}
                    {!currentSession && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(128, 128, 128, 0.2)',
                          backdropFilter: 'blur(2px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          p: 2,
                          zIndex: 10,
                          borderRadius: 1,
                          color: 'var(--primary-text)',
                        }}
                      >
                        <Typography variant="h6" component="div">
                          请先创建或选择一个会话
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{
                      height: "100%",
                      p: 2,
                      bgcolor: 'var(--background-color)',
                      borderTop: '1px solid var(--card-border)',
                      overflow: 'hidden',
                      // 当没有会话时，通过CSS禁用交互
                      pointerEvents: !currentSession ? 'none' : 'auto',
                    }}>
                      <BPlusOperationPanel
                        settings={operationSettings}
                        onSettingsChange={handleOperationSettingsChange}
                        isAnimating={isAnimating}
                        onInsert={handleOperationInsert}
                        onDelete={handleOperationDelete}
                        onReset={handleOperationReset}
                        onSave={handleOperationSave}
                        onRestore={handleOperationRestore}
                        showMessage={showMessage}
                      />
                    </Box>
                  </Box>
                </Panel>

                {/* 拖拽手柄 */}
                <PanelResizeHandle style={{
                  width: 2,
                  background: "var(--card-border)",
                  cursor: "col-resize",
                  transition: "background-color 0.2s ease"
                }} />

                {/* 右侧：智能助手对话区域 */}
                <Panel minSize={30} defaultSize={60}>
                  <Box sx={{
                    height: "100%",
                    p: 2,
                    bgcolor: 'var(--background-color)',
                    borderTop: '1px solid var(--card-border)',
                    borderLeft: '1px solid var(--card-border)',
                    overflow: 'auto'
                  }}>
                    <ChatReservedArea
                      onSendMessage={handleSendMessage}
                      onGetHelp={handleGetHelp}
                      onGetSuggestion={handleGetSuggestion}
                    />
                  </Box>
                </Panel>

              </PanelGroup>
            </Panel>

          </PanelGroup>
        </Panel>

      </PanelGroup>

      {/* 新建会话模态框 */}
      <NewSessionModal
        open={isNewSessionModalOpen}
        onClose={handleCloseNewSessionModal}
        onConfirm={handleCreateSession}
        loading={isCreatingSession}
      />

      {/* 清理所有记录确认对话框 */}
      <ClearAllConfirmDialog
        open={isClearAllDialogOpen}
        onClose={handleCloseClearAllDialog}
        onConfirm={handleDeleteAllSessions}
        loading={isClearingAll}
        sessionCount={allSessions.length}
      />

      {/* Snackbar 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BPlusHistoryPage;
