'use client';

import React, { useMemo, useState } from 'react';
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
import { sampleERData, employeeDepartmentERData, weakEntityERData } from '@/types/ERDiagramTypes/erDiagram';

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
    name: '学生选课系统示例',
    description: '包含学生、教师、授课实体集的ER图',
    icon: <LibraryIcon />,
    data: sampleERData
  },
  {
    id: 'employee',
    name: '员工部门项目示例',
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

  // 生成时间以自动填充会话名称
  const defaultName = useMemo(() => `${new Date().toLocaleString('zh-CN')}`, []);

  // 简化后的 handleCreate 方法
  const handleCreate = async () => {
    const finalName = diagramName.trim() || defaultName;

    setIsCreating(true);
    setError('');

    try {
      await createNewDiagram(finalName, diagramDescription, selectedTemplate);

      // 显示成功消息
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setDiagramName('');
        setDiagramDescription('');
        setSelectedTemplate('blank');
        setError('');
        onClose();
      }, 500);
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

  // 在文本输入框上绑定回车的创建
  const handleKeyDown = (event: React.KeyboardEvent) =>{
    if(event.key === 'Enter'){
      // 组织默认的回车（文本换行）
      event.preventDefault();
      if(!isCreating){
        handleCreate();
      }
    }
  }

  // 在选中模板的card上绑定回车和空格输入的创建
  const handleTemplateKeyDown = (event: React.KeyboardEvent, templateId:string) => {
    if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();

        setSelectedTemplate(templateId);
        handleCreate();
    }
  }

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
            label="图表名称 (可选)"
            value={diagramName}
            onChange={(e) => {
              setDiagramName(e.target.value);
              if (error) setError(''); // 清除错误信息
            }}
            fullWidth
            sx={{ mb: 2 }}
            placeholder={defaultName}
            onKeyDown={handleKeyDown}
          />

          <TextField
            label="图表描述"
            value={diagramDescription}
            onChange={(e) => setDiagramDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="图表描述（可选）"
            onKeyDown={handleKeyDown}
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
              tabIndex = {0} // 让card可以被键盘聚焦
              onKeyDown = {(e) => handleTemplateKeyDown(e, template.id)}
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
          disabled={isCreating}
          startIcon={<AddIcon />}
        >
          {isCreating ? '创建中...' : '创建图表'}
        </Button>
      </DialogActions>

      <Snackbar
        open={showSuccess}
        autoHideDuration={1000}
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
