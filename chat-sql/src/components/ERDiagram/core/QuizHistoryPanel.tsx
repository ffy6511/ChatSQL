// Quiz历史管理面板组件
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Quiz as QuizIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CalendarToday as DateIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { Quiz, QuizHistoryPanelProps } from '@/types/ERDiagramTypes/quiz';
import { quizStorage } from '@/services/quizStorage';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';

/**
 * Quiz历史管理面板组件
 * 显示已保存题目的列表，支持删除、修改名称、查看答案等功能
 */
const QuizHistoryPanel: React.FC<QuizHistoryPanelProps> = ({
  onQuizSelect,
  onQuizDelete,
  onQuizUpdate,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');

  const { setDiagramData } = useERDiagramContext();

  // 加载题目列表
  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allQuizzes = await quizStorage.getAllQuizzes();
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error('加载题目失败:', err);
      setError('加载题目失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时加载题目
  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  // 打开菜单
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, quiz: Quiz) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedQuiz(quiz);
  }, []);

  // 关闭菜单
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedQuiz(null);
  }, []);

  // 打开编辑对话框
  const handleEditOpen = useCallback(() => {
    if (selectedQuiz) {
      setEditName(selectedQuiz.name);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  }, [selectedQuiz, handleMenuClose]);

  // 关闭编辑对话框
  const handleEditClose = useCallback(() => {
    setEditDialogOpen(false);
    setEditName('');
  }, []);

  // 确认编辑
  const handleEditConfirm = useCallback(async () => {
    if (!selectedQuiz || !editName.trim()) return;

    try {
      await quizStorage.updateQuiz(selectedQuiz.id, { name: editName.trim() });
      await loadQuizzes(); // 重新加载列表
      onQuizUpdate?.(selectedQuiz.id, { name: editName.trim() });
      handleEditClose();
    } catch (err) {
      console.error('更新题目失败:', err);
      setError('更新题目失败，请重试');
    }
  }, [selectedQuiz, editName, loadQuizzes, onQuizUpdate, handleEditClose]);

  // 打开删除确认对话框
  const handleDeleteOpen = useCallback(() => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  // 关闭删除确认对话框
  const handleDeleteClose = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  // 确认删除
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedQuiz) return;

    try {
      await quizStorage.deleteQuiz(selectedQuiz.id);
      await loadQuizzes(); // 重新加载列表
      onQuizDelete?.(selectedQuiz.id);
      handleDeleteClose();
    } catch (err) {
      console.error('删除题目失败:', err);
      setError('删除题目失败，请重试');
    }
  }, [selectedQuiz, loadQuizzes, onQuizDelete, handleDeleteClose]);

  // 查看答案ER图
  const handleViewAnswer = useCallback(() => {
    if (selectedQuiz) {
      setDiagramData(selectedQuiz.referenceAnswer);
      onQuizSelect?.(selectedQuiz);
    }
    handleMenuClose();
  }, [selectedQuiz, setDiagramData, onQuizSelect, handleMenuClose]);

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 截取描述文本
  const truncateDescription = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 头部标题 */}
      <Box sx={{ p: 2, borderBottom: '1px solid var(--card-border)' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <QuizIcon sx={{ color: 'var(--secondary-text)' }} />
          <Typography variant="h6" sx={{ color: 'var(--primary-text)' }}>
            题目历史
          </Typography>
          <Chip
            label={quizzes.length}
            size="small"
            sx={{
              backgroundColor: 'var(--hover-bg)',
              color: 'var(--secondary-text)',
            }}
          />
        </Stack>
      </Box>

      {/* 内容区域 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {/* 加载状态 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 题目列表 */}
        {!loading && !error && (
          <>
            {quizzes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <QuizIcon sx={{ fontSize: 48, color: 'var(--secondary-text)', mb: 2 }} />
                <Typography variant="body2" color="var(--secondary-text)">
                  暂无题目历史
                </Typography>
                <Typography variant="caption" color="var(--secondary-text)" sx={{ mt: 1, display: 'block' }}>
                  请在智能助手中生成一些题目
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {quizzes.map((quiz) => (
                  <Card
                    key={quiz.id}
                    sx={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-bg)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {/* 题目名称 */}
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: 'var(--primary-text)',
                              mb: 0.5,
                              wordBreak: 'break-word',
                            }}
                          >
                            {quiz.name}
                          </Typography>

                          {/* 创建时间 */}
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                            <DateIcon sx={{ fontSize: 14, color: 'var(--secondary-text)' }} />
                            <Typography variant="caption" color="var(--secondary-text)">
                              {formatDate(quiz.createdAt)}
                            </Typography>
                          </Stack>

                          {/* 题目描述 */}
                          <Stack direction="row" alignItems="flex-start" spacing={0.5}>
                            <DescriptionIcon sx={{ fontSize: 14, color: 'var(--secondary-text)', mt: 0.2 }} />
                            <Typography
                              variant="body2"
                              color="var(--secondary-text)"
                              sx={{
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                              }}
                            >
                              {truncateDescription(quiz.description)}
                            </Typography>
                          </Stack>
                        </Box>

                        {/* 操作按钮 */}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, quiz)}
                          sx={{
                            color: 'var(--secondary-text)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-bg)',
                            },
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          },
        }}
      >
        <MenuItem onClick={handleViewAnswer}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 18 }} />
          查看答案ER图
        </MenuItem>
        <MenuItem onClick={handleEditOpen}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          修改名称
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          删除题目
        </MenuItem>
      </Menu>

      {/* 编辑名称对话框 */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>修改题目名称</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="题目名称"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>取消</Button>
          <Button onClick={handleEditConfirm} variant="contained" disabled={!editName.trim()}>
            确认
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除题目 "{selectedQuiz?.name}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizHistoryPanel;
