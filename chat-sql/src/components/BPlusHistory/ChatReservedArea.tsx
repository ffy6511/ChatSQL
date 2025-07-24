/**
 * B+树智能助手对话框预留区域
 * 参考LLMWindow样式设计，为后续功能扩展做准备
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip,
  Avatar
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as RobotIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

interface ChatReservedAreaProps {
  // 预留的回调接口，后续实现时使用
  onSendMessage?: (message: string) => void;
  onGetHelp?: () => void;
  onGetSuggestion?: () => void;
}

// 模拟的对话消息类型
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 预设的快捷问题
const quickQuestions = [
  "如何理解B+树的分裂过程？",
  "删除操作什么时候需要合并节点？",
  "B+树的阶数如何影响性能？",
  "叶子节点的链表有什么作用？"
];

const ChatReservedArea: React.FC<ChatReservedAreaProps> = ({
  onSendMessage,
  onGetHelp,
  onGetSuggestion
}) => {
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 发送消息处理
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // 模拟AI回复（后续替换为真实API调用）
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `这是一个关于"${inputMessage}"的智能回复。当前功能正在开发中，将支持B+树操作指导、概念解释和问题解答。`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);

    onSendMessage?.(inputMessage);
  };

  // 快捷问题点击处理
  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染消息列表
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <Box sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
          textAlign: 'center',
          overflow:'auto'
        }}>
          <RobotIcon 
            sx={{ 
              fontSize: 48, 
              color: 'var(--secondary-text)',
              opacity: 0.6
            }} 
          />
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'var(--secondary-text)',
              maxWidth: '280px',
              lineHeight: 1.5
            }}
          >
            我可以帮助您理解B+树的操作原理，解答相关问题，并提供学习建议。
          </Typography>
          
          {/* 快捷问题 */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
            <Typography 
              variant="caption" 
              sx={{ color: 'var(--secondary-text)', mb: 1 }}
            >
              快速开始：
            </Typography>
            {quickQuestions.slice(0, 2).map((question, index) => (
              <Chip
                key={index}
                label={question}
                variant="outlined"
                size="small"
                onClick={() => handleQuickQuestion(question)}
                sx={{
                  cursor: 'pointer',
                  color: 'var(--secondary-text)',
                  borderColor: 'var(--card-border)',
                  '&:hover': {
                    backgroundColor: 'var(--button-hover)',
                    borderColor: 'var(--link-color)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ 
        height: '100%',
        overflow: 'auto',
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              mb: 1
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: message.type === 'user' ? 'var(--link-color)' : 'var(--success-color)',
                fontSize: '0.875rem'
              }}
            >
              {message.type === 'user' ? <PersonIcon /> : <RobotIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  bgcolor: message.type === 'user' ? 'var(--button-hover)' : 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 2,
                  maxWidth: '100%'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'var(--primary-text)',
                    wordBreak: 'break-word'
                  }}
                >
                  {message.content}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'var(--secondary-text)',
                    mt: 0.5,
                    display: 'block'
                  }}
                >
                  {formatTime(message.timestamp)}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}
        
        {/* 加载状态 */}
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'var(--success-color)',
                fontSize: '0.875rem'
              }}
            >
              <RobotIcon />
            </Avatar>
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                bgcolor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 2
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ color: 'var(--secondary-text)' }}
              >
                正在思考中...
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        height: '100%',
        bgcolor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* 标题栏 */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'var(--primary-text)',
            fontWeight: 600,
            fontSize: '1rem'
          }}
        >
          智能体
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={onGetSuggestion}
            sx={{ color: 'var(--secondary-text)' }}
          >
            <LightbulbIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={onGetHelp}
            sx={{ color: 'var(--secondary-text)' }}
          >
            <HelpIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* 消息区域 */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderMessages()}
      </Box>

      {/* 输入区域 */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid var(--card-border)',
        display: 'flex',
        gap: 1,
        alignItems: 'flex-end'
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="询问B+树相关问题..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          size="small"
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'var(--input-bg)',
              '& fieldset': {
                borderColor: 'var(--input-border)'
              }
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          sx={{ 
            minWidth: 'auto',
            px: 2,
            py: 1
          }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatReservedArea;
