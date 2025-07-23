/**
 * 清理所有记录确认对话框组件
 * 用于确认删除所有B+树历史记录的操作
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface ClearAllConfirmDialogProps {
  /** 对话框是否打开 */
  open: boolean;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 确认清理回调 */
  onConfirm: () => void;
  /** 是否正在清理中 */
  loading?: boolean;
  /** 会话数量（用于显示） */
  sessionCount?: number;
}

const ClearAllConfirmDialog: React.FC<ClearAllConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  sessionCount = 0
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        color: 'var(--primary-text)',
        borderBottom: '1px solid var(--card-border)',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6" component="span">
            确认清理所有记录
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body1" sx={{ color: 'var(--primary-text)' }}>
            您即将删除所有B+树历史记录，此操作不可撤销。
          </Typography>

          {sessionCount > 0 && (
            <Typography variant="body2" sx={{ color: 'var(--secondary-text)' }}>
              当前共有 <strong>{sessionCount}</strong> 个会话记录将被删除。
            </Typography>
          )}

          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>警告：</strong>此操作将永久删除以下内容：
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>所有历史会话</li>
              <li>所有操作步骤记录</li>
              <li>所有B+树状态快照</li>
              <li>相关的统计数据</li>
            </Box>
          </Alert>

          <Typography variant="body2" sx={{ color: 'var(--tertiary-text)', fontStyle: 'italic' }}>
            删除后，您可以重新开始创建新的B+树会话。
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: '1px solid var(--card-border)',
        pt: 2,
        gap: 1
      }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          color="inherit"
        >
          取消
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? undefined : <DeleteIcon />}
        >
          {loading ? '清理中...' : '确认清理'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClearAllConfirmDialog;
