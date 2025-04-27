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
      p: 1,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          backgroundColor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 2,
        }}>
          <AssignmentIcon sx={{ 
            fontSize: 32,
            mr: 1,
            color: 'primary.main',
          }} />
          <Typography variant="h5" component="h2" fontWeight="bold" textAlign={'center'}>
            查询要求
          </Typography>
        </Box>

        {description && (
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              component="h3" 
              gutterBottom
              color="text.secondary"
              fontSize="1rem"
            >
              问题描述
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                backgroundColor: 'action.hover',
                p: 2,
                borderRadius: 1,
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
              color="text.secondary"
              fontSize="1rem"
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
                    color: completedProblems.has(index) ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.87)',
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
