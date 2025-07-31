// 统一的历史记录模态框组件
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  InputAdornment,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';

// 通用历史记录项接口
export interface HistoryRecord {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  type?: string;
  metadata?: Record<string, any>;
}

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  records: HistoryRecord[];
  loading?: boolean;
  error?: string;
  onSelect: (record: HistoryRecord) => void;
  onDelete?: (recordId: string) => void;
  onEdit?: (recordId: string, newTitle: string) => void;
  onPreview?: (record: HistoryRecord) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  showActions?: boolean;
}

/**
 * 统一的历史记录模态框组件
 * 可在ER模块和聊天界面中复用
 */
const HistoryModal: React.FC<HistoryModalProps> = ({
  open,
  onClose,
  title,
  records,
  loading = false,
  error,
  onSelect,
  onDelete,
  onEdit,
  onPreview,
  searchPlaceholder = '搜索历史记录...',
  emptyMessage = '暂无历史记录',
  showActions = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // 过滤记录
  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // 开始编辑
  const handleEditStart = (record: HistoryRecord) => {
    setEditingId(record.id);
    setEditTitle(record.title);
  };

  // 确认编辑
  const handleEditConfirm = () => {
    if (editingId && editTitle.trim() && onEdit) {
      onEdit(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };

  // 取消编辑
  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // 处理删除
  const handleDelete = (recordId: string) => {
    if (onDelete) {
      onDelete(recordId);
    }
  };

  // 处理预览
  const handlePreview = (record: HistoryRecord) => {
    if (onPreview) {
      onPreview(record);
    }
  };

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setEditingId(null);
      setEditTitle('');
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            maxHeight: '80vh',
          },
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        color: 'var(--primary-text)',
        borderBottom: '1px solid var(--card-border)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* 搜索框 */}
        <Box sx={{ p: 2, borderBottom: '1px solid var(--card-border)' }}>
          <TextField
            fullWidth
            size="small"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'var(--secondary-text)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'var(--input-bg)',
                '& fieldset': {
                  borderColor: 'var(--card-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--primary-color)',
                },
              },
            }}
          />
        </Box>

        {/* 内容区域 */}
        <Box sx={{ minHeight: 300, maxHeight: 400, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : filteredRecords.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              p: 4,
              color: 'var(--secondary-text)',
            }}>
              <HistoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body2">
                {searchQuery ? '未找到匹配的记录' : emptyMessage}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredRecords.map((record, index) => (
                <React.Fragment key={record.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemButton
                      onClick={() => onSelect(record)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          editingId === record.id ? (
                            <TextField
                              size="small"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditConfirm();
                                } else if (e.key === 'Escape') {
                                  handleEditCancel();
                                }
                              }}
                              onBlur={handleEditConfirm}
                              autoFocus
                              sx={{ width: '100%' }}
                            />
                          ) : (
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: 'var(--primary-text)',
                                wordBreak: 'break-word',
                              }}
                            >
                              {record.title}
                            </Typography>
                          )
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            {record.description && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'var(--secondary-text)',
                                  mb: 0.5,
                                  wordBreak: 'break-word',
                                }}
                              >
                                {record.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DateIcon sx={{ fontSize: 14, color: 'var(--secondary-text)' }} />
                              <Typography variant="caption" color="var(--secondary-text)">
                                {formatDate(record.createdAt)}
                              </Typography>
                              {record.type && (
                                <Chip
                                  label={record.type}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      {showActions && editingId !== record.id && (
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {onPreview && (
                              <Tooltip title="预览">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreview(record);
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {onEdit && (
                              <Tooltip title="编辑">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStart(record);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {onDelete && (
                              <Tooltip title="删除">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(record.id);
                                  }}
                                  sx={{ color: '#f44336' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </ListItemSecondaryAction>
                      )}
                    </ListItemButton>
                  </ListItem>
                  {index < filteredRecords.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid var(--card-border)' }}>
        <Button onClick={onClose}>
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistoryModal;
