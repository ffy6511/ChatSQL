'use client';

import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import ERDiagram from '@/components/ERDiagram/ERDiagram';
import { weakEntityERData } from '@/types/erDiagram';

const WeakEntityTestPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          弱实体集双边框渲染测试
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          此页面用于测试弱实体集和弱关系的双边框渲染效果。
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>弱实体集</strong>：家属实体应显示为双边框矩形
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>弱关系</strong>：连接弱实体集的"拥有家属"关系应显示为双边框菱形
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>普通关系</strong>：不连接弱实体集的"参与项目"关系应显示为单边框菱形
        </Typography>
      </Box>

      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          height: '70vh',
          backgroundColor: 'background.paper',
          borderRadius: 2
        }}
      >
        <ERDiagram
          data={weakEntityERData}
          layoutConfig={{
            entitySpacing: 250,
            relationshipSpacing: 150,
            levelSpacing: 350,
            startX: 50,
            startY: 50
          }}
          showControls={true}
          showBackground={true}
        />
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          测试说明
        </Typography>
        <Typography variant="body2" paragraph>
          1. <strong>员工</strong>实体：普通实体，单边框矩形
        </Typography>
        <Typography variant="body2" paragraph>
          2. <strong>家属</strong>实体：弱实体集，应显示双边框矩形，主键属性显示为"DIS"标签
        </Typography>
        <Typography variant="body2" paragraph>
          3. <strong>项目</strong>实体：普通实体，单边框矩形
        </Typography>
        <Typography variant="body2" paragraph>
          4. <strong>拥有家属</strong>关系：连接弱实体集，应显示双边框菱形
        </Typography>
        <Typography variant="body2" paragraph>
          5. <strong>参与项目</strong>关系：不连接弱实体集，应显示单边框菱形
        </Typography>
      </Box>
    </Container>
  );
};

export default WeakEntityTestPage;
