'use client';

import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress
} from '@mui/material';
import {
  FolderOpen as OpenIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import { ERDiagramMetadata } from '@/services/erDiagramStorage';

interface OpenDiagramModalProps {
  open: boolean;
  onClose: () => void;
}

const OpenDiagramModal: React.FC<OpenDiagramModalProps> = ({ open, onClose }) => {
  const { loadDiagram, listDiagrams, deleteDiagram } = useERDiagramContext();
  const [diagrams, setDiagrams] = useState<ERDiagramMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 加载图表列表
  const loadDiagramList = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const diagramList = await listDiagrams();
      setDiagrams(diagramList);
    } catch (err) {
      setError('加载图表列表失败');
      console.error('Failed to load diagrams:', err);
    } finally {
      setLoading(false);
    }
  };

  // 打开图表
  const handleOpenDiagram = async (id: string) => {
    setIsOpening(true);
    setError(null);
    
    try {
      await loadDiagram(id);
      onClose();
    } catch (err) {
      setError('打开图表失败');
      console.error('Failed to open diagram:', err);
    } finally {
      setIsOpening(false);
    }
  };

  // 删除图表
  const handleDeleteDiagram = async (id: string) => {
    setIsDeleting(id);
    setError(null);
    
    try {
      await deleteDiagram(id);
      // 重新加载列表
      await loadDiagramList();
      // 如果删除的是选中的图表，清除选中状态
      if (selectedDiagram === id) {
        setSelectedDiagram(null);
      }
    } catch (err) {
      setError('删除图表失败');
      console.error('Failed to delete diagram:', err);
    } finally {
      setIsDeleting(null);
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

  // 模态框打开时加载数据
  useEffect(() => {
    if (open) {
      loadDiagramList();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: '60vh' }
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
          <IconButton onClick={loadDiagramList} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : diagrams.length === 0 ? (
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
                {diagrams.map((diagram) => (
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
                          disabled={isOpening}
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
                          disabled={isDeleting === diagram.id}
                        >
                          {isDeleting === diagram.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteIcon />
                          )}
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
          disabled={!selectedDiagram || isOpening}
          startIcon={<OpenIcon />}
        >
          {isOpening ? '打开中...' : '打开图表'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OpenDiagramModal;
