// 动态消息输入组件 - 根据智能体类型显示不同的输入界面

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
} from '@mui/icons-material';
import { AgentType, AGENTS_INFO, AgentInputField } from '@/types/agents';

interface DynamicMessageInputProps {
  selectedAgent: AgentType;
  onSendMessage: (agentType: string, inputValues: Record<string, string>) => Promise<void>;
  disabled?: boolean;
}

const DynamicMessageInput: React.FC<DynamicMessageInputProps> = ({
  selectedAgent,
  onSendMessage,
  disabled = false,
}) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 获取当前智能体信息
  const agentInfo = AGENTS_INFO[selectedAgent];

  // 当智能体类型改变时，重置输入值
  useEffect(() => {
    setInputValues({});
    setErrors({});
  }, [selectedAgent]);

  // 处理输入值变化
  const handleInputChange = (fieldName: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // 清除该字段的错误
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // 验证输入
  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    for (const field of agentInfo.inputFields) {
      if (field.required && !inputValues[field.name]?.trim()) {
        newErrors[field.name] = `请填写${field.label}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    if (disabled) return;
    
    if (!validateInputs()) {
      return;
    }

    try {
      await onSendMessage(selectedAgent, inputValues);
      setInputValues({});
      setErrors({});
      
      // 重新聚焦第一个输入框
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // 检查是否可以发送
  const canSend = agentInfo.inputFields.every(field => 
    !field.required || inputValues[field.name]?.trim()
  );

  // 渲染输入字段
  const renderInputField = (field: AgentInputField, index: number) => {
    const isMultiline = field.type === 'textarea';
    const value = inputValues[field.name] || '';
    const error = errors[field.name];

    return (
      <Box key={field.name}>
        <Typography
          variant="caption"
          sx={{ 
            color: 'var(--secondary-text)',
            display: 'block',
            mb: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {field.label}
          {field.required && (
            <span style={{ color: 'var(--error-color, #f44336)' }}> *</span>
          )}
        </Typography>
        
        <TextField
          ref={index === 0 ? firstInputRef : undefined}
          fullWidth
          multiline={isMultiline}
          rows={isMultiline ? 3 : 1}
          maxRows={isMultiline ? 6 : 1}
          value={value}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder}
          disabled={disabled}
          error={!!error}
          helperText={error || field.description}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--input-bg)',
              borderRadius: 1,
              fontSize: '0.875rem',
              '& fieldset': {
                borderColor: 'var(--input-border)',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-error fieldset': {
                borderColor: 'var(--error-color, #f44336)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'var(--input-text)',
              '&::placeholder': {
                color: 'var(--secondary-text)',
                opacity: 1,
              },
            },
            '& .MuiFormHelperText-root': {
              fontSize: '0.7rem',
              color: error ? 'var(--error-color, #f44336)' : 'var(--secondary-text)',
            },
          }}
        />
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderTop: '1px solid var(--card-border)',
        backgroundColor: 'var(--card-bg)',
        maxHeight: '40%', // 设置最大高度为40%
        overflowY: 'auto', // 添加Y轴滚动条
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        spacing={2}
        sx={{
          flex: 1,
          minHeight: 0, // 允许Stack收缩
          overflowY: 'auto', // 确保Stack内容可滚动
        }}
      >
        {/* 输入字段 */}
        {agentInfo.inputFields.map((field, index) => renderInputField(field, index))}

        {/* 发送按钮区域 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mt: 1,
          flexShrink: 0, // 防止按钮区域被压缩
        }}>
          <Tooltip title="发送 (Enter)">
            <IconButton
              onClick={handleSendMessage}
              disabled={disabled || !canSend}
              color="primary"
              sx={{
                backgroundColor: canSend ? 'primary.main' : 'grey.300',
                color: 'white',
                '&:hover': {
                  backgroundColor: canSend ? 'primary.dark' : 'grey.400',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Paper>
  );
};

export default DynamicMessageInput;
