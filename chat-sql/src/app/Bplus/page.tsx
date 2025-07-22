'use client';

import React, { useState, useCallback } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import BPlusTreeVisualizer from '@/components/BPlusXyflow/BPlusTreeVisualizer';
import BPlusOperationPanel from '@/components/BPlusXyflow/BPlusOperationPanel';
import HistoryManagementPanel from '@/components/BPlusHistory/HistoryManagementPanel';
import ChatReservedArea from '@/components/BPlusHistory/ChatReservedArea';

/**
 * B+树操作历史页面 - 支持版本控制与回溯功能
 * 采用左右布局：左侧历史管理面板，右侧分为上下两部分（B+树渲染区域和操作控制区域）
 */
const BPlusHistoryPage: React.FC = () => {
  // 临时状态，后续将通过历史管理系统控制
  const [initialKeys] = useState<number[]>([1, 2, 3, 4, 5]);
  const [order] = useState<number>(3);

  // 历史管理状态
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>();

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

  // 历史管理回调函数
  const handleSessionSelect = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedStepIndex(undefined);
    showMessage(`已选择会话: ${sessionId}`, 'info');
  }, [showMessage]);

  const handleStepSelect = useCallback((stepIndex: number) => {
    setSelectedStepIndex(stepIndex);
    showMessage(`已选择步骤: ${stepIndex + 1}`, 'info');
  }, [showMessage]);

  const handleCreateSession = useCallback(() => {
    showMessage('创建新会话功能开发中...', 'info');
  }, [showMessage]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    showMessage(`删除会话 ${sessionId} 功能开发中...`, 'warning');
  }, [showMessage]);

  const handleRenameSession = useCallback((sessionId: string, newName: string) => {
    showMessage(`重命名会话 ${sessionId} 为 ${newName} 功能开发中...`, 'info');
  }, [showMessage]);

  // 操作面板回调函数（临时实现）
  const handleInsert = useCallback(async (value: number) => {
    showMessage(`插入操作 ${value} 功能开发中...`, 'info');
  }, [showMessage]);

  const handleDelete = useCallback(async (value: number) => {
    showMessage(`删除操作 ${value} 功能开发中...`, 'info');
  }, [showMessage]);

  const handleReset = useCallback(() => {
    showMessage('重置操作功能开发中...', 'info');
  }, [showMessage]);

  const handleSave = useCallback(async () => {
    showMessage('保存操作功能开发中...', 'info');
  }, [showMessage]);

  const handleRestore = useCallback(async () => {
    showMessage('恢复操作功能开发中...', 'info');
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

  // Snackbar关闭处理
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      bgcolor: 'var(--background-color)',
      overflow: 'hidden'
    }}>
      {/* 使用可拖拽的面板组实现左右布局 */}
      <PanelGroup direction="horizontal" style={{ height: "100vh" }}>
        
        {/* 左侧：历史管理面板 */}
        <Panel minSize={20} maxSize={50} defaultSize={25}>
          <Box sx={{
            height: "100%",
            p: 2,
            bgcolor: 'var(--background-color)',
            borderRight: '1px solid var(--card-border)',
            overflow: 'hidden'
          }}>
            <HistoryManagementPanel
              selectedSessionId={selectedSessionId}
              selectedStepIndex={selectedStepIndex}
              onSessionSelect={handleSessionSelect}
              onStepSelect={handleStepSelect}
              onCreateSession={handleCreateSession}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
            />
          </Box>
        </Panel>

        {/* 拖拽手柄 */}
        <PanelResizeHandle style={{ 
          width: 6, 
          background: "var(--card-border)", 
          cursor: "col-resize",
          transition: "background-color 0.2s ease"
        }} />

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
                {/* 临时使用现有的BPlusTreeVisualizer，后续将重构为受控组件 */}
                <BPlusTreeVisualizer
                  initialKeys={initialKeys}
                  order={order}
                />
              </Box>
            </Panel>

            {/* 拖拽手柄 */}
            <PanelResizeHandle style={{ 
              height: 6, 
              background: "var(--card-border)", 
              cursor: "row-resize",
              transition: "background-color 0.2s ease"
            }} />

            {/* 下部分：操作控制区域 */}
            <Panel minSize={20} defaultSize={35}>
              <PanelGroup direction="horizontal" style={{ height: "100%" }}>
                
                {/* 左侧：B+树操作模块 */}
                <Panel minSize={30} defaultSize={60}>
                  <Box sx={{
                    height: "100%",
                    p: 2,
                    bgcolor: 'var(--background-color)',
                    borderTop: '1px solid var(--card-border)',
                    overflow: 'hidden'
                  }}>
                    <BPlusOperationPanel
                      settings={{
                        isAnimationEnabled: true,
                        animationSpeed: 500,
                        order: order
                      }}
                      onSettingsChange={(settings) => {
                        showMessage(`设置已更新: 阶数=${settings.order}, 动画=${settings.isAnimationEnabled}`, 'info');
                      }}
                      isAnimating={false}
                      onInsert={handleInsert}
                      onDelete={handleDelete}
                      onReset={handleReset}
                      onSave={handleSave}
                      onRestore={handleRestore}
                      showMessage={showMessage}
                    />
                  </Box>
                </Panel>

                {/* 拖拽手柄 */}
                <PanelResizeHandle style={{ 
                  width: 6, 
                  background: "var(--card-border)", 
                  cursor: "col-resize",
                  transition: "background-color 0.2s ease"
                }} />

                {/* 右侧：对话框预留区域 */}
                <Panel minSize={30} defaultSize={40}>
                  <Box sx={{
                    height: "100%",
                    p: 2,
                    bgcolor: 'var(--background-color)',
                    borderTop: '1px solid var(--card-border)',
                    borderLeft: '1px solid var(--card-border)',
                    overflow: 'hidden'
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
