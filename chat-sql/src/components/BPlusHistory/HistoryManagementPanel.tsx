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
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Chip,
  Divider,
  Button
} from '@mui/material';
import {
  History as HistoryIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import { HistoryStep, HistorySession } from '@/types/bPlusHistory';

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
  onRenameSession
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  // 格式化时间显示
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取操作类型的颜色和图标
  const getOperationStyle = (operation: string) => {
    switch (operation) {
      case 'insert':
        return { color: 'success', icon: <AddIcon fontSize="small" /> };
      case 'delete':
        return { color: 'error', icon: <DeleteIcon fontSize="small" /> };
      case 'reset':
        return { color: 'warning', icon: <EditIcon fontSize="small" /> };
      default:
        return { color: 'default', icon: <ScheduleIcon fontSize="small" /> };
    }
  };

  // 渲染会话列表
  const renderSessionList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 创建新会话按钮 */}
      <Box sx={{ p: 1, borderBottom: '1px solid var(--card-border)' }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onCreateSession}
          size="small"
          fullWidth
          sx={{ color: 'var(--primary-text)' }}
        >
          新建会话
        </Button>
      </Box>

      {/* 会话列表 */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {mockSessions.map((session) => (
          <ListItem key={session.id} disablePadding>
            <ListItemButton
              selected={selectedSessionId === session.id}
              onClick={() => onSessionSelect?.(session.id)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'var(--button-hover)',
                  borderLeft: '3px solid var(--link-color)'
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: selectedSessionId === session.id ? 600 : 400,
                      color: 'var(--primary-text)'
                    }}
                  >
                    {session.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ color: 'var(--secondary-text)' }}
                    >
                      {formatTime(session.updatedAt)} • {session.steps.length} 步骤
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        label={`阶数 ${session.order}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          height: '20px',
                          fontSize: '0.7rem',
                          color: 'var(--secondary-text)',
                          borderColor: 'var(--card-border)'
                        }}
                      />
                    </Box>
                  </Box>
                }
              />
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession?.(session.id);
                }}
                sx={{ color: 'var(--secondary-text)' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
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
        
        <List sx={{ p: 0 }}>
          {currentSession.steps.map((step, index) => {
            const { color, icon } = getOperationStyle(step.operation);
            const isActive = index === selectedStepIndex;
            const isCurrent = index === currentSession.currentStepIndex;
            
            return (
              <React.Fragment key={step.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => onStepSelect?.(index)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'var(--button-hover)',
                        border: '1px solid var(--link-color)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%',
                      gap: 1
                    }}>
                      {/* 步骤图标 */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: `var(--${color === 'default' ? 'secondary' : color === 'success' ? 'success' : color === 'error' ? 'error' : 'warning'}-text)`
                      }}>
                        {icon}
                      </Box>
                      
                      {/* 步骤内容 */}
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'var(--primary-text)',
                            fontWeight: isActive ? 600 : 400
                          }}
                        >
                          {step.description}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ color: 'var(--secondary-text)' }}
                        >
                          {formatTime(step.timestamp)}
                        </Typography>
                      </Box>
                      
                      {/* 当前步骤标识 */}
                      {isCurrent && (
                        <PlayIcon 
                          fontSize="small" 
                          sx={{ color: 'var(--link-color)' }}
                        />
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < currentSession.steps.length - 1 && (
                  <Divider sx={{ ml: 4, borderColor: 'var(--card-border)' }} />
                )}
              </React.Fragment>
            );
          })}
        </List>
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
