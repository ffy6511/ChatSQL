/**
 * B+树历史管理面板组件
 * 包含会话列表和步骤时间线的Tab切换界面
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import {
  History as HistoryIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

import { HistorySession } from '@/types/bPlusHistory';
import { BPlusHistorySessionItem, BPlusHistoryStepItem } from './BPlusHistoryItem';
import HistoryActionBar from './HistoryActionBar';

interface HistoryManagementPanelProps {
  // 当前选中的会话和步骤
  selectedSessionId?: string;
  selectedStepIndex?: number;
  
  // 回调函数
  onSessionSelect?: (sessionId: string) => void;
  onStepSelect?: (stepIndex: number) => void;
  onCreateSession?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newName: string) => void;
  onDeleteAllSessions?: () => void;
}

// 临时模拟数据
const mockSessions: HistorySession[] = [
  {
    id: '1',
    name: '基础插入操作练习',
    order: 3,
    steps: [
      {
        id: '1-1',
        operation: 'initial',
        timestamp: Date.now() - 3600000,
        description: '初始化空树',
        nodes: [],
        edges: [],
        keys: [],
        success: true
      },
      {
        id: '1-2',
        operation: 'insert',
        key: 5,
        timestamp: Date.now() - 3000000,
        description: '插入键值5',
        nodes: [],
        edges: [],
        keys: [5],
        success: true
      },
      {
        id: '1-3',
        operation: 'insert',
        key: 3,
        timestamp: Date.now() - 2400000,
        description: '插入键值3',
        nodes: [],
        edges: [],
        keys: [3, 5],
        success: true
      },
      {
        id: '1-4',
        operation: 'insert',
        key: 7,
        timestamp: Date.now() - 1800000,
        description: '插入键值7',
        nodes: [],
        edges: [],
        keys: [3, 5, 7],
        success: true
      },
    ],
    currentStepIndex: 3,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
    description: '基础插入操作练习会话',
    tags: ['练习', '插入'],
    isCompleted: false,
    statistics: {
      totalOperations: 4,
      insertCount: 3,
      deleteCount: 0,
      resetCount: 0,
      successCount: 4,
      errorCount: 0,
      totalDuration: 1500
    }
  },
  {
    id: '2',
    name: '删除操作演示',
    order: 4,
    steps: [
      {
        id: '2-1',
        operation: 'initial',
        timestamp: Date.now() - 1200000,
        description: '初始化空树',
        nodes: [],
        edges: [],
        keys: [],
        success: true
      },
      {
        id: '2-2',
        operation: 'insert',
        key: 10,
        timestamp: Date.now() - 900000,
        description: '插入键值10',
        nodes: [],
        edges: [],
        keys: [10],
        success: true
      },
      {
        id: '2-3',
        operation: 'delete',
        key: 10,
        timestamp: Date.now() - 600000,
        description: '删除键值10',
        nodes: [],
        edges: [],
        keys: [],
        success: true
      },
    ],
    currentStepIndex: 2,
    createdAt: Date.now() - 1200000,
    updatedAt: Date.now() - 600000,
    description: '删除操作演示会话',
    tags: ['演示', '删除'],
    isCompleted: true,
    statistics: {
      totalOperations: 3,
      insertCount: 1,
      deleteCount: 1,
      resetCount: 0,
      successCount: 3,
      errorCount: 0,
      totalDuration: 800
    }
  }
];

const HistoryManagementPanel: React.FC<HistoryManagementPanelProps> = ({
  selectedSessionId,
  selectedStepIndex,
  onSessionSelect,
  onStepSelect,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onDeleteAllSessions
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>('');

  // 过滤会话列表
  const filteredSessions = mockSessions.filter(session =>
    session.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    session.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
    session.tags?.some(tag => tag.toLowerCase().includes(searchValue.toLowerCase()))
  );

  // 渲染会话列表
  const renderSessionList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 操作栏 */}
      <HistoryActionBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onCreateNew={onCreateSession || (() => {})}
        onDeleteAll={onDeleteAllSessions || (() => {})}
        disableDeleteAll={mockSessions.length === 0}
      />

      {/* 会话列表 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {filteredSessions.length === 0 ? (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'var(--tertiary-text)',
            textAlign: 'center'
          }}>
            <Typography variant="body2">
              {searchValue ? '未找到匹配的记录' : '暂无历史记录'}
            </Typography>
          </Box>
        ) : (
          filteredSessions.map((session) => (
            <BPlusHistorySessionItem
              key={session.id}
              session={session}
              isActive={selectedSessionId === session.id}
              onSelect={onSessionSelect || (() => {})}
              onRename={onRenameSession || (() => {})}
              onDelete={onDeleteSession || (() => {})}
            />
          ))
        )}
      </Box>
    </Box>
  );

  // 渲染步骤时间线
  const renderStepTimeline = () => {
    const currentSession = mockSessions.find(s => s.id === selectedSessionId);
    
    if (!currentSession) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--secondary-text)'
        }}>
          <Typography variant="body2">请选择一个会话查看步骤</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height: '100%', overflow: 'auto', p: 1 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 2, 
            color: 'var(--primary-text)',
            fontWeight: 600
          }}
        >
          {currentSession.name}
        </Typography>
        
        <Box sx={{ p: 0 }}>
          {currentSession.steps.map((step, index) => (
            <BPlusHistoryStepItem
              key={step.id}
              step={step}
              stepIndex={index}
              isActive={index === selectedStepIndex}
              isCurrent={index === currentSession.currentStepIndex}
              onSelect={onStepSelect || (() => {})}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        height: '100%',
        bgcolor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Tab 标签页 */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          borderBottom: '1px solid var(--card-border)',
          '& .MuiTab-root': {
            color: 'var(--secondary-text)',
            '&.Mui-selected': {
              color: 'var(--link-color)'
            }
          }
        }}
      >
        <Tab 
          icon={<HistoryIcon />} 
          label="历史会话" 
          iconPosition="start"
          sx={{ fontSize: '0.875rem' }}
        />
        <Tab 
          icon={<TimelineIcon />} 
          label="操作步骤" 
          iconPosition="start"
          sx={{ fontSize: '0.875rem' }}
        />
      </Tabs>

      {/* Tab 内容 */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 0 ? renderSessionList() : renderStepTimeline()}
      </Box>
    </Paper>
  );
};

export default HistoryManagementPanel;
