'use client'

import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useLLMContext } from '@/contexts/LLMContext';

const ProblemViewer: React.FC = () => {
  const { llmResult } = useLLMContext();
  const problem = llmResult?.data?.outputs?.problem || [];
  const description = llmResult?.data?.outputs?.description || '';

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
            <ListItem key={index} sx={{ py: 1 }}>
              <ListItemText 
                primary={item}
                primaryTypographyProps={{
                  style: { whiteSpace: 'pre-wrap' }
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