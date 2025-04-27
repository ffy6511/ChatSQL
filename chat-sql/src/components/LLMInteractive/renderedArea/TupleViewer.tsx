'use client'

import { Box, Typography, IconButton, Paper } from '@mui/material';
import { useLLMContext } from '@/contexts/LLMContext';
import TableDisplay from './TableDisplay';
import { useState } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Height } from '@mui/icons-material';

export default function TupleViewer() {
  const { llmResult } = useLLMContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const tupleData = llmResult?.data?.outputs?.tuples || [];
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : tupleData.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < tupleData.length - 1 ? prev + 1 : 0));
  };

  if (tupleData.length === 0) {
    return (
      <Box sx={{ 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="body2" color="text.secondary">
          暂无数据
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
      overflow: 'auto', // 允许内容滚动
    }}>
      {/* 表名显示区域 - 减小高度和内边距 */}
      <Paper 
        elevation={0}
        sx={{
          mb: 1, // 减小底部间距
          py: 1, // 减小上下内边距
          px: 1, // 保持左右内边距
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px 8px 0 0',
          minHeight: '25px', // 设置最小高度
        }}
      >
        <Typography variant="subtitle1" component="h2">
          {tupleData[currentIndex].tableName}
        </Typography>
      </Paper>

      {/* 表格展示区域 */}
      <Box sx={{ 
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
         minHeight: '400px', // 确保有足够的空间显示表格
        // maxHeight: '50px',
      }}>
        <IconButton 
          onClick={handlePrevious}
          sx={{ 
            position: 'absolute',
            left: 0,
            zIndex: 2,
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>

        <Box sx={{ 
          width: '100%',
          mx: 6, // 为左右箭头留出空间
        }}>
          <TableDisplay tableInfo={tupleData[currentIndex]} />
        </Box>

        <IconButton 
          onClick={handleNext}
          sx={{ 
            position: 'absolute',
            right: 0,
            zIndex: 2,
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>

      {/* 页码指示器 */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        mt: 1, // 减小顶部间距
        gap: 1,
        py: 1, // 添加上下内边距
      }}>
        {tupleData.map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: index === currentIndex ? 'primary.main' : 'action.disabled',
              cursor: 'pointer',
            }}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </Box>
    </Box>
  );
}
