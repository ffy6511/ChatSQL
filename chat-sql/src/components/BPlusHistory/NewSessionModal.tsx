/**
 * 新建B+树会话模态框组件
 * 用于创建新的B+树操作会话，允许用户设置阶数和名称
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// 新建会话的表单数据接口
export interface NewSessionFormData {
  name: string;
  order: number;
  description?: string;
  tags?: string[];
}

interface NewSessionModalProps {
  /** 模态框是否打开 */
  open: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 确认创建回调 */
  onConfirm: (formData: NewSessionFormData) => void;
  /** 是否正在创建中 */
  loading?: boolean;
}

// 预设的标签选项
const PRESET_TAGS = [
  '学习',
  '练习',
  '测试',
  '演示',
  '实验',
  '作业',
  '项目'
];

const NewSessionModal: React.FC<NewSessionModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false
}) => {
  // 表单状态
  const [formData, setFormData] = useState<NewSessionFormData>({
    name: '',
    order: 3,
    description: '',
    tags: []
  });
  
  // 表单验证错误
  const [errors, setErrors] = useState<{
    name?: string;
    order?: string;
  }>({});

  // 标签输入状态
  const [tagInput, setTagInput] = useState<string>('');

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      order: 3,
      description: '',
      tags: []
    });
    setErrors({});
    setTagInput('');
  }, []);

  // 表单验证
  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    // 验证名称
    if (!formData.name.trim()) {
      newErrors.name = '请输入会话名称';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '会话名称至少需要2个字符';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = '会话名称不能超过50个字符';
    }

    // 验证阶数
    if (formData.order < 3 || formData.order > 10) {
      newErrors.order = '阶数必须在3-10之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 处理表单字段变更
  const handleFieldChange = useCallback((field: keyof NewSessionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  // 添加标签
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag) && formData.tags!.length < 5) {
      handleFieldChange('tags', [...(formData.tags || []), tag]);
      setTagInput('');
    }
  }, [tagInput, formData.tags, handleFieldChange]);

  // 删除标签
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    handleFieldChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  }, [formData.tags, handleFieldChange]);

  // 处理确认
  const handleConfirm = useCallback(() => {
    if (validateForm()) {
      // 生成默认名称（如果为空）
      const finalFormData = {
        ...formData,
        name: formData.name.trim() || `B+树会话 ${new Date().toLocaleString('zh-CN')}`,
        description: formData.description?.trim() || undefined,
        tags: formData.tags?.length ? formData.tags : ['新建']
      };
      
      onConfirm(finalFormData);
    }
  }, [formData, validateForm, onConfirm]);

  // 处理关闭
  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onClose();
    }
  }, [loading, resetForm, onClose]);

  // 处理标签输入键盘事件
  const handleTagInputKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

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
          <AddIcon color="primary" />
          <Typography variant="h6" component="span">
            新建B+树会话
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 会话名称 */}
          <TextField
            label="会话名称"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name || '为您的B+树操作会话起一个名称'}
            fullWidth
            placeholder={`B+树会话 ${new Date().toLocaleString('zh-CN')}`}
            disabled={loading}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'var(--secondary-text)'
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'var(--input-border)'
                },
                '&:hover fieldset': {
                  borderColor: 'var(--link-color)'
                }
              }
            }}
          />

          {/* 阶数选择 */}
          <FormControl fullWidth error={!!errors.order}>
            <InputLabel sx={{ color: 'var(--secondary-text)' }}>B+树阶数</InputLabel>
            <Select
              value={formData.order}
              onChange={(e) => handleFieldChange('order', e.target.value as number)}
              label="B+树阶数"
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--input-border)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--link-color)'
                }
              }}
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map(order => (
                <MenuItem key={order} value={order}>
                  {order}阶
                </MenuItem>
              ))}
            </Select>
            {errors.order && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.order}
              </Typography>
            )}
          </FormControl>

          {/* 会话描述 */}
          <TextField
            label="会话描述（可选）"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="描述这个会话的用途或目标..."
            disabled={loading}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'var(--secondary-text)'
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'var(--input-border)'
                },
                '&:hover fieldset': {
                  borderColor: 'var(--link-color)'
                }
              }
            }}
          />

          {/* 标签管理 */}
          <Box>
            <Typography variant="body2" sx={{ color: 'var(--secondary-text)', mb: 1 }}>
              标签（最多5个）
            </Typography>
            
            {/* 已添加的标签 */}
            {formData.tags && formData.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    disabled={loading}
                  />
                ))}
              </Box>
            )}

            {/* 标签输入 */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="添加标签"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiInputLabel-root': {
                    color: 'var(--secondary-text)'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'var(--input-border)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--link-color)'
                    }
                  }
                }}
                disabled={loading || (formData.tags?.length || 0) >= 5}
                placeholder="输入标签名称后按回车"
              />
              <Button
                onClick={handleAddTag}
                disabled={!tagInput.trim() || (formData.tags?.length || 0) >= 5 || loading}
                size="small"
                variant="outlined"
              >
                添加
              </Button>
            </Box>

            {/* 预设标签 */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: 'var(--tertiary-text)' }}>
                快速添加：
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {PRESET_TAGS.filter(tag => !formData.tags?.includes(tag)).map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => {
                      if ((formData.tags?.length || 0) < 5) {
                        handleFieldChange('tags', [...(formData.tags || []), tag]);
                      }
                    }}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'var(--hover-bg)' }
                    }}
                    disabled={loading || (formData.tags?.length || 0) >= 5}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* 提示信息 */}
          <Alert severity="info" sx={{ mt: 1 }}>
            创建会话后，您可以开始进行B+树的插入、删除等操作，所有操作都会被记录在历史中。
          </Alert>
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
          startIcon={loading ? undefined : <AddIcon />}
        >
          {loading ? '创建中...' : '创建会话'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewSessionModal;
