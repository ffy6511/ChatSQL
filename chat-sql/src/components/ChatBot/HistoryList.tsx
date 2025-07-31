import React, { useMemo } from 'react';
import {
  Box,
  List,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  HistoryOutlined as HistoryIcon,
} from '@mui/icons-material';
import { ChatHistory } from '@/types/chatBotTypes/chatbot';
import HistoryItem from './HistoryItem';

interface HistoryListProps {
  chatHistory: ChatHistory[];
  searchQuery: string;
  currentHistoryId?: string;
  onLoadHistory: (historyId: string) => void;
  onDeleteHistory: (historyId: string) => void;
  onEditHistoryTitle: (historyId: string, newTitle: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({
  chatHistory,
  searchQuery,
  currentHistoryId,
  onLoadHistory,
  onDeleteHistory,
  onEditHistoryTitle,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = React.useState<string | null>(null);

  // 筛选历史记录
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) {
      return chatHistory;
    }

    return chatHistory.filter(history =>
      (history.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      history.messages.some(msg => {
        // 处理不同类型的消息内容
        const contentStr = typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content);
        return contentStr.toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [chatHistory, searchQuery]);

  // 调试过滤后的历史记录
  console.log('HistoryList - Filtered history:', {
    searchQuery,
    originalCount: chatHistory.length,
    filteredCount: filteredHistory.length,
    filteredItems: filteredHistory.slice(0, 2)
  });

  const handleDeleteClick = (historyId: string) => {
    setDeletingHistoryId(historyId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingHistoryId) {
      onDeleteHistory(deletingHistoryId);
      setDeleteConfirmOpen(false);
      setDeletingHistoryId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeletingHistoryId(null);
  };

  // 空状态显示
  if (filteredHistory.length === 0) {
    return (
      <>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            px: 2,
            textAlign: 'center',
          }}
        >
          <HistoryIcon
            sx={{
              fontSize: 48,
              color: 'var(--icon-color)',
              opacity: 0.5,
              mb: 2,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'var(--secondary-text)',
              fontSize: '0.875rem',
            }}
          >
            {searchQuery ? '未找到匹配的历史记录' : '暂无历史记录'}
          </Typography>
          {searchQuery && (
            <Typography
              variant="caption"
              sx={{
                color: 'var(--secondary-text)',
                fontSize: '0.75rem',
                mt: 1,
              }}
            >
              尝试使用不同的关键词搜索
            </Typography>
          )}
        </Box>

        {/* 删除确认对话框 */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleCancelDelete}
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
            确认删除
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'var(--secondary-text)' }}>
              确定要删除这条历史记录吗？此操作无法撤销。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete}>
              取消
            </Button>
            <Button
              onClick={handleConfirmDelete}
              sx={{ color: '#f44336' }}
            >
              删除
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // 历史记录列表
  return (
    <>
      <List dense sx={{ px: 1 }}>
        {filteredHistory.map((history) => (
          <HistoryItem
            key={history.id}
            history={history}
            isSelected={currentHistoryId === history.id}
            onLoad={onLoadHistory}
            onDelete={handleDeleteClick}
            onEditTitle={onEditHistoryTitle}
          />
        ))}
      </List>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
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
          确认删除
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--secondary-text)' }}>
            确定要删除这条历史记录吗？此操作无法撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            取消
          </Button>
          <Button
            onClick={handleConfirmDelete}
            sx={{ color: '#f44336' }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HistoryList;
