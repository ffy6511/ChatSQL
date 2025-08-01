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
  onInsert: (value: number) => Promise<boolean>;
  onDelete: (value: number) => Promise<boolean>;
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
  if(!value || value.trim() === '') return false;

  // 使用正则表达式分割字符串， 并过滤掉空字符串
  const parts = value.trim().split(/\s+/);

  // 检查各个部分是否为有效的整数
  return parts.every(part =>{
    if(part === '' || part === '-') return false;
    const num = parseInt(part, 10);
    return !isNaN(num) && Number.isInteger(num) && num >= -99999 && num <= 99999;
  });
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
      showMessage('插入失败：请输入一个或多个空格分隔的有效整数（-99999~99999）', 'warning');
      return;
    }

    // 解析、去重
    const valuesToInsert = Array.from(
      new Set(
        insertValue.trim().split(/\s+/).map(s => parseInt(s, 10))
      )
    )

    // 记录操作成功的个数
    let successCount = 0;

    try{
      for(const key of valuesToInsert){
          const success = await onInsert(key);
          if(success) successCount += 1;
        }

        // 根据成功次数，显示不同的信息
        if(successCount === valuesToInsert.length){
          showMessage(`成功插入 ${valuesToInsert.length} 个key`, 'success');
        } else if(successCount > 0){
          showMessage(`部分成功：插入 ${successCount} 个key，有 ${valuesToInsert.length - successCount} 个key失败（可能已经存在）`, 'warning');
        }else{
          showMessage('插入失败：所有key都已存在', 'error');
        }

        setInsertValue('');
      }
        catch(error){
          // showMessage('插入失败', 'error');
        }
      },[insertValue, onInsert, showMessage]);
    
  // 删除处理函数
  const handleDelete = useCallback(async () => {
    if (!validateInput(deleteValue)) {
      showMessage('删除失败：一个或者多个空格分隔的有效整数（-99999~99999）', 'warning');
      return;
    }
    
    // 解析并去重
    const valuesToDelete = Array.from(
      new Set(
        deleteValue.trim().split(/\s+/).map(s => parseInt(s, 10))
      )
    );
    // 记录操作成功的个数
    let successCount = 0;

    try{
      // 依次删除
      for(const key of valuesToDelete){
        const success = await onDelete(key);
        if(success) successCount += 1;
      }

      // 根据成功次数，显示不同的信息
      if(successCount === valuesToDelete.length){
        setDeleteValue(''); // 删除之后清空输入框
        showMessage(`成功删除 ${valuesToDelete.length} 个key`, 'success');
      } else if(successCount > 0){
        showMessage(`部分成功：删除 ${successCount} 个key，有 ${valuesToDelete.length - successCount} 个key失败（可能不存在）`, 'warning');
      }else{
        showMessage('删除失败：所有key都不存在', 'error');
      }

      setDeleteValue('');
    } catch(error){
      // showMessage('删除失败', 'error');
    }
  }, [deleteValue, onDelete, showMessage]);


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
            label="插入值（可通过空格分隔以批处理）"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            type="text"
            size="small"
            disabled={isAnimating}
            error={insertValue !== '' && !validateInput(insertValue)}
            helperText={insertValue !== '' && !validateInput(insertValue) ? '请输入有效的整数（-99999～99999）' : ''}
            sx={{
              flex: 1,             
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
            label="删除值（可通过空格分隔以批处理）"
            value={deleteValue}
            onChange={(e) => setDeleteValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
            type="text"
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
