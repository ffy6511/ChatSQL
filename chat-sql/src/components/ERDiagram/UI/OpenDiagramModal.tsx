'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  FolderOpen as OpenIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';

interface OpenDiagramModalProps {
  open: boolean;
  onClose: () => void;
}

const OpenDiagramModal: React.FC<OpenDiagramModalProps> = ({ open, onClose }) => {
  const { diagramList, loadDiagram, deleteDiagram } = useERDiagramContext();
  const [error, setError] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 打开图表
  const handleOpenDiagram = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await loadDiagram(id);
      onClose();
    } catch (err) {
      setError('打开图表失败');
      console.error('Failed to open diagram:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除图表
  const handleDeleteDiagram = async (id: string) => {
    setError(null);

    try {
      await deleteDiagram(id);
      // 如果删除的是选中的图表，清除选中状态
      if (selectedDiagram === id) {
        setSelectedDiagram(null);
      }
    } catch (err) {
      setError('删除图表失败');
      console.error('Failed to delete diagram:', err);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 移除手动刷新逻辑，Context 会自动管理列表刷新

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography>
              打开ER图
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              选择一个已保存的图表继续编辑
            </Typography>
          </Box>
          {/* 移除手动刷新按钮，Context 会自动管理列表刷新 */}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {diagramList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              暂无保存的图表
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              创建您的第一个ER图开始使用
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>图表名称</TableCell>
                  <TableCell>描述</TableCell>
                  <TableCell align="center">实体数</TableCell>
                  <TableCell align="center">关系数</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>最后修改</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagramList.map((diagram) => (
                  <TableRow
                    key={diagram.id}
                    hover
                    selected={selectedDiagram === diagram.id}
                    onClick={() => setSelectedDiagram(diagram.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {diagram.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {diagram.description || '无描述'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={diagram.entityCount}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={diagram.relationshipCount}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(diagram.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(diagram.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDiagram(diagram.id);
                          }}
                          disabled={isLoading}
                        >
                          <OpenIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDiagram(diagram.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose}>
          取消
        </Button>
        <Button
          onClick={() => selectedDiagram && handleOpenDiagram(selectedDiagram)}
          variant="contained"
          disabled={!selectedDiagram || isLoading}
          startIcon={<OpenIcon />}
        >
          {isLoading ? '打开中...' : '打开图表'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OpenDiagramModal;
