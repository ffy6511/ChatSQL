'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  LocalLibrary as LibraryIcon
} from '@mui/icons-material';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import { sampleERData, employeeDepartmentERData, weakEntityERData } from '@/types/erDiagram';

interface NewDiagramModalProps {
  open: boolean;
  onClose: () => void;
}

// 预设模板
const templates = [
  {
    id: 'blank',
    name: '空白图表',
    description: '从空白画布开始创建ER图',
    icon: <AddIcon />,
    data: null
  },
  {
    id: 'sample',
    name: '示例图书馆系统',
    description: '包含图书、作者、借阅者的基本ER图',
    icon: <LibraryIcon />,
    data: sampleERData
  },
  {
    id: 'employee',
    name: '员工部门项目',
    description: '展示员工、部门、项目关系的企业ER图',
    icon: <BusinessIcon />,
    data: employeeDepartmentERData
  },
  {
    id: 'weak_entity',
    name: '弱实体集示例',
    description: '展示弱实体集和双边框渲染的ER图',
    icon: <SchoolIcon />,
    data: weakEntityERData
  }
];

const NewDiagramModal: React.FC<NewDiagramModalProps> = ({ open, onClose }) => {
  const { createNewDiagram } = useERDiagramContext();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [diagramName, setDiagramName] = useState<string>('');
  const [diagramDescription, setDiagramDescription] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  // 简化后的 handleCreate 方法
  const handleCreate = async () => {
    if (!diagramName.trim()) {
      setError('请输入图表名称');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await createNewDiagram(diagramName, diagramDescription, selectedTemplate);

      // 显示成功消息
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setDiagramName('');
        setDiagramDescription('');
        setSelectedTemplate('blank');
        setError('');
        onClose();
      }, 1200);
    } catch (error) {
      console.error('Failed to create diagram:', error);
      setError(error instanceof Error ? error.message : '创建图表失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setShowSuccess(false);
      setDiagramName('');
      setDiagramDescription('');
      setSelectedTemplate('blank');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md" // xs, sm, md, lg, xl
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Typography>
          新建ER图
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          选择一个模板开始创建您的ER图
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <TextField
            label="图表名称"
            value={diagramName}
            onChange={(e) => {
              setDiagramName(e.target.value);
              if (error) setError(''); // 清除错误信息
            }}
            fullWidth
            required
            sx={{ mb: 2 }}
            placeholder="输入图表名称"
            error={!!error && !diagramName.trim()}
          />

          <TextField
            label="图表描述"
            value={diagramDescription}
            onChange={(e) => setDiagramDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="输入图表描述（可选）"
          />
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          选择模板
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
          {templates.map((template) => (
            <Card
              key={template.id}
              sx={{
                cursor: 'pointer',
                border: selectedTemplate === template.id ? 2 : 1,
                borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2
                },
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 1, color: 'primary.main' }}>
                    {template.icon}
                  </Box>
                  <Typography variant="h6" component="h3">
                    {template.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {template.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={isCreating}>
          取消
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!diagramName.trim() || isCreating}
          startIcon={<AddIcon />}
        >
          {isCreating ? '创建中...' : '创建图表'}
        </Button>
      </DialogActions>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          图表创建成功！
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default NewDiagramModal;
