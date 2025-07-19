'use client';

import React, { useState } from 'react';
import BPlusTreeVisualizerNew from '@/components/BPlusXyflow/BPlusTreeVisualizerNew';
import BPlusTreeVisualizer from '@/components/BPlusXyflow/BPlusTreeVisualizer';
import { Box, Typography, Paper } from '@mui/material';

const BPlusTestPage: React.FC = () => {
  // 1. 提供一组初始数据，而不是从零开始
  const [initialKeys] = useState<number[]>([10, 20, 5, 15, 25, 3, 7]);
  const [order] = useState<number>(3);

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8' }}>

      
      <Box sx={{ flex: 1, position: 'relative', m: 2, mt: 1 }}>
        <BPlusTreeVisualizerNew
          initialKeys={initialKeys}
          order={order}
        />
      </Box>
    </Box>
  );
};

export default BPlusTestPage;