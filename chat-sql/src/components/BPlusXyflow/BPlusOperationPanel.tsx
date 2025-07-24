/**
 * B+树操作控制面板组件
 * 从BPlusTreeVisualizer中解耦出来的独立操作面板
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
} from '@mui/icons-material';

// 设置接口
interface Settings {
  isAnimationEnabled: boolean;
  animationSpeed: number;
  order: number;
}

// 操作面板Props接口
interface BPlusOperationPanelProps {
  // 设置相关
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  
  // 操作状态
  isAnimating: boolean;
  error?: string;
  
  // 操作回调
  onInsert: (value: number) => Promise<void>;
  onDelete: (value: number) => Promise<void>;
  onReset: () => void;
  onSave: () => Promise<void>;
  onRestore: () => Promise<void>;
  
  // 消息回调
  showMessage: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
}

/**
 * 输入验证函数 - 支持正负整数和0
 */
const validateInput = (value: string): boolean => {
  if (value === '' || value === '-') return false;
  const num = parseInt(value);
  return !isNaN(num) && Number.isInteger(num) && num >= -999999 && num <= 999999;
};

const BPlusOperationPanel: React.FC<BPlusOperationPanelProps> = ({
  settings,
  onSettingsChange,
  isAnimating,
  error,
  onInsert,
  onDelete,
  onReset,
  onSave,
  onRestore,
  showMessage
}) => {
  const [insertValue, setInsertValue] = useState<string>('');
  const [deleteValue, setDeleteValue] = useState<string>('');

  // 插入处理函数
  const handleInsert = useCallback(async () => {
    if (!validateInput(insertValue)) {
      showMessage('插入失败：请输入有效的整数（支持正负数和0）', 'warning');
      return;
    }
    
    const key = parseInt(insertValue);
    try {
      await onInsert(key);
      setInsertValue('');
    } catch (error) {
      // 错误处理由父组件负责
    }
  }, [insertValue, onInsert, showMessage]);

  // 删除处理函数
  const handleDelete = useCallback(async () => {
    if (!validateInput(deleteValue)) {
      showMessage('删除失败：请输入有效的整数（支持正负数和0）', 'warning');
      return;
    }
    
    const key = parseInt(deleteValue);
    try {
      await onDelete(key);
      setDeleteValue('');
    } catch (error) {
      // 错误处理由父组件负责
    }
  }, [deleteValue, onDelete, showMessage]);

  // 设置变更处理
  const handleOrderChange = useCallback((newOrder: number) => {
    if (newOrder >= 3 && newOrder <= 10) {
      onSettingsChange({ ...settings, order: newOrder });
    }
  }, [settings, onSettingsChange]);

  const handleAnimationToggle = useCallback((enabled: boolean) => {
    onSettingsChange({ ...settings, isAnimationEnabled: enabled });
  }, [settings, onSettingsChange]);

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '80%',
        bgcolor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 2,
        overflow: 'auto'
      }}
    >
      {/* <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontSize: '1rem', 
          fontWeight: 'bold',
          color: 'var(--primary-text)'
        }}
      >
        B+树操作
      </Typography> */}

      {/* 动画开关控制 */}
      <Box sx={{ mb: 1, display:'flex', alignItems:'center' }}>
        {/* <Typography 
          variant="body2" 
          sx={{ color: 'var(--secondary-text)' }} 
          gutterBottom
        >
          动画设置
        </Typography> */}
        <FormControlLabel
          control={
            <Switch
              checked={settings.isAnimationEnabled}
              onChange={(e) => handleAnimationToggle(e.target.checked)}
              disabled={isAnimating}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'var(--secondary-text)' }}>
              {settings.isAnimationEnabled ? '启用动画' : '禁用动画'}
            </Typography>
          }
          sx={{ m: 0 }}
        />

        {/* 重置按钮 */}
        <Button
          variant="outlined"
          onClick={onReset}
          disabled={isAnimating}
          size="small"
          sx = {{ marginLeft:'auto' }}
        >
          重置
        </Button>

      </Box>

      {/* 错误信息显示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 插入操作 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="插入值"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            type="number"
            size="small"
            disabled={isAnimating}
            error={insertValue !== '' && !validateInput(insertValue)}
            helperText={insertValue !== '' && !validateInput(insertValue) ? '请输入有效的整数（支持正负数和0）' : ''}
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
                },
                '& .MuiOutlinedInput-input': {
                  color: 'var(--primary-text)' // ✅ 输入值的颜色
                }
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleInsert}
            disabled={isAnimating || !validateInput(insertValue)}
            size="small"
            sx={{ color: 'var(--secondary-text) !important' }}
          >
            插入
          </Button>
        </Box>

        {/* 删除操作 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="删除值"
            value={deleteValue}
            onChange={(e) => setDeleteValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
            type="number"
            size="small"
            disabled={isAnimating}
            error={deleteValue !== '' && !validateInput(deleteValue)}
            helperText={deleteValue !== '' && !validateInput(deleteValue) ? '请输入有效的整数（支持正负数和0）' : ''}
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
                },
                '& .MuiOutlinedInput-input': {
                  color: 'var(--primary-text)' // ✅ 输入值的颜色
                }
              }
            }}
          />
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={isAnimating || !validateInput(deleteValue)}
            size="small"
            sx={{ color: 'var(--secondary-text) !important' }}
          >
            删除
          </Button>
        </Box>



      </Box>
    </Paper>
  );
};

export default BPlusOperationPanel;
