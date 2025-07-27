import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { ChatHistory } from '@/types/chatbot';
import HistoryList from './HistoryList';

interface HistoryPanelProps {
  isOpen: boolean;
  chatHistory: ChatHistory[];
  currentHistoryId?: string;
  onNewChat: () => void;
  onLoadHistory: (historyId: string) => void;
  onDeleteHistory: (historyId: string) => void;
  onEditHistoryTitle: (historyId: string, newTitle: string) => void;
  onClearAllHistory?: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  chatHistory,
  currentHistoryId,
  onNewChat,
  onLoadHistory,
  onDeleteHistory,
  onEditHistoryTitle,
  onClearAllHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);

  const handleClearAllClick = () => {
    setClearAllConfirmOpen(true);
  };

  const handleConfirmClearAll = () => {
    if (onClearAllHistory) {
      onClearAllHistory();
    }
    setClearAllConfirmOpen(false);
  };

  const handleCancelClearAll = () => {
    setClearAllConfirmOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          width: 280,
          height: '100%',
          backgroundColor: 'var(--card-bg)',
          borderRight: '1px solid var(--card-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          left: 48, // 紧贴IconSidebar右侧
          top: 0,
          zIndex: 10,
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* 搜索框 */}
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            placeholder="搜索历史记录..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--icon-color)', fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'var(--input-bg)',
                borderRadius: 1,
                '& fieldset': {
                  borderColor: 'var(--input-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--input-hover-border)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary-color)',
                },
              },
              '& .MuiInputBase-input': {
                color: 'var(--primary-text)',
                fontSize: '0.875rem',
                '&::placeholder': {
                  color: 'var(--secondary-text)',
                  opacity: 1,
                },
              },
            }}
          />
        </Box>

        {/* 操作按钮 */}
        <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1 }}>
          <Tooltip title="新建对话">
            <IconButton
              onClick={onNewChat}
              size="small"
              sx={{
                color: 'var(--icon-color)',
                backgroundColor: 'var(--button-bg)',
                border: '1px solid var(--button-border)',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'var(--button-hover-bg)',
                  borderColor: 'var(--button-hover-border)',
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="清空所有历史记录">
            <IconButton
              onClick={handleClearAllClick}
              size="small"
              disabled={chatHistory.length === 0}
              sx={{
                color: chatHistory.length === 0 ? 'var(--disabled-text)' : '#f44336',
                backgroundColor: 'var(--button-bg)',
                border: '1px solid var(--button-border)',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: chatHistory.length === 0 ? 'var(--button-bg)' : 'rgba(244, 67, 54, 0.1)',
                  borderColor: chatHistory.length === 0 ? 'var(--button-border)' : '#f44336',
                },
                '&:disabled': {
                  backgroundColor: 'var(--button-bg)',
                  borderColor: 'var(--button-border)',
                },
              }}
            >
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 历史记录列表 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <HistoryList
            chatHistory={chatHistory}
            searchQuery={searchQuery}
            currentHistoryId={currentHistoryId}
            onLoadHistory={onLoadHistory}
            onDeleteHistory={onDeleteHistory}
            onEditHistoryTitle={onEditHistoryTitle}
          />
        </Box>
      </Box>

      {/* 清空所有历史记录确认对话框 */}
      <Dialog
        open={clearAllConfirmOpen}
        onClose={handleCancelClearAll}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
            },
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--primary-text)' }}>
          确认清空所有历史记录
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--secondary-text)' }}>
            确定要清空所有历史记录吗？此操作无法撤销，将删除所有对话历史。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClearAll}>
            取消
          </Button>
          <Button
            onClick={handleConfirmClearAll}
            sx={{ color: '#f44336' }}
          >
            清空
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HistoryPanel;
