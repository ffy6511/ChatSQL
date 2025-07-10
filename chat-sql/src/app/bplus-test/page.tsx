'use client';

import React, { useState } from 'react';
import { BPlusTreeVisualizer } from '@/components/BPlusXyflow';
import { Box, Typography, Paper } from '@mui/material';

const BPlusTestPage: React.FC = () => {
  // 1. 提供一组初始数据，而不是从零开始
  const [initialKeys] = useState<number[]>([10, 20, 5, 15, 25, 3, 7]);
  const [order] = useState<number>(3);

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8' }}>
      <Paper elevation={2} sx={{ p: 2, m: 2, mb: 0 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          B+树交互测试页
        </Typography>
        <Typography variant="body1" color="text.secondary">
          这是一个独立的测试页面，用于验证 `BPlusTreeVisualizer` 组件的插入、删除和动画功能。
        </Typography>
      </Paper>
      
      <Box sx={{ flex: 1, position: 'relative', m: 2, mt: 1 }}>
        <BPlusTreeVisualizer 
          initialKeys={initialKeys} 
          order={order} 
        />
      </Box>
    </Box>
  );
};

export default BPlusTestPage;