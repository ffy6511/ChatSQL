'use client'

import React, { useMemo } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useLLMContext } from '@/contexts/LLMContext';
import { useCompletionContext } from '@/contexts/CompletionContext';

const ProblemViewer: React.FC = () => {
  const { llmResult } = useLLMContext();
  const { completedProblems } = useCompletionContext();
  
  // 使用 useMemo 缓存数据，避免不必要的重新计算
  const problem = useMemo(() => llmResult?.data?.outputs?.problem || [], [llmResult?.data?.outputs?.problem]);
  const description = useMemo(() => llmResult?.data?.outputs?.description || '', [llmResult?.data?.outputs?.description]);

  // 移除调试日志
  // console.log('ProblemViewer state:', {
  //   completedProblems: Array.from(completedProblems),
  //   problem: llmResult?.data?.outputs?.problem,
  //   expectedResults: llmResult?.data?.outputs?.expected_result
  // });

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto',
      borderRadius: 2,
      p: 1,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 2,
          backgroundColor: 'transparent',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 2,
        }}>
          <AssignmentIcon sx={{ 
            fontSize: 30,
            color: 'primary.main',
            // marginLeft: 'auto', // 使图标在容器中水平居中
          }} />
          <Typography variant="h5" component="h2" fontWeight="bold" textAlign={'center'} width='100%'>
            查询要求
          </Typography>
        </Box>

        {description && (
          <Box sx={{ mb: 4  }}>
            <Typography 
              variant="h6" 
              component="h3" 
              gutterBottom
              fontSize="1rem"
              sx={{
                color:"var(--secondary-text)"
              }}
            >
              问题描述
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                backgroundColor: 'action.hover',
                p: 2,
                borderRadius: 1,
                color:"var(--primary-text)"
              }}
            >
              {description}
            </Typography>
          </Box>
        )}

            <Typography 
              variant="h6" 
              component="h3" 
              gutterBottom
              fontSize="1rem"
              sx={{
                color:"var(--secondary-text)"
              }}
            >
              具体要求
            </Typography>
        
        <List>
          {problem.map((item, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                py: 1,
                backgroundColor: completedProblems.has(index) ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                borderRadius: 1,
                transition: 'all 0.3s ease',
                position: 'relative',
                textDecoration: 'underline', // 添加下划线
                textDecorationColor: 'var(--tertiary-text)', // 设置下划线颜色
                textDecorationThickness: '0.5px', // 设置下划线粗细
                textUnderlineOffset: '5px', // 设置下划线与文字的距离
                '&::after': completedProblems.has(index) ? {
                  content: '"✓"',
                  position: 'absolute',
                  right: '8px',
                  color: '#4CAF50',
                  fontWeight: 'bold'
                } : {},
              }}
            >
              <ListItemText 
                primary={item}
                primaryTypographyProps={{
                  style: { 
                    textDecoration: completedProblems.has(index) ? 'line-through' : 'none',
                    color: completedProblems.has(index) ? 'var(--tertiary-text)': 'var(--primary-text)',
                    fontStyle: completedProblems.has(index) ? 'italic' : 'normal',
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default ProblemViewer;
