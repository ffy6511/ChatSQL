'use client'

import { Box, Typography, IconButton, Paper } from '@mui/material';
import { useLLMContext } from '@/contexts/LLMContext';
import TableDisplay from './TableDisplay';
import { useState, useEffect } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export default function TupleViewer() {
  const { llmResult } = useLLMContext();
  const [currentIndex, setCurrentIndex] = useState(0);

  const tupleData = llmResult?.data?.outputs?.tuples || [];
  
  // 确保 currentIndex 在有效范围内
  useEffect(() => {
    if (currentIndex >= tupleData.length && tupleData.length > 0) {
      setCurrentIndex(0);
    }
  }, [tupleData, currentIndex]);

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
      backgroundColor: '#f8f4f4',
      p: 0,
      overflow: 'auto', // 允许内容滚动
      gap: 0, // 移除子元素之间的间距
    }}>
      {/* 表名显示区域 - 固定高度和位置 */}
      <Paper
        elevation={0}
        sx={{
          mb: 0, // 移除底部间距
          py: 1, // 保持上下内边距
          px: 1, // 保持左右内边距
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px 8px 0 0',
          height: '40px', // 设置固定高度
          position: 'relative', // 添加相对定位
          width: '100%', // 确保宽度为100%
        }}
      >
        <Typography variant="subtitle1" component="h2">
          {tupleData[currentIndex]?.tableName || '无表名'}
        </Typography>
      </Paper>

      {/* 表格展示区域 */}
      <Box sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start', // 顶部对齐
        height: '400px', // 设置固定高度
        mt: 0, // 移除顶部边距，与表名紧密连接
      }}>
        <IconButton
          onClick={handlePrevious}
          sx={{
            position: 'absolute',
            left: 0,
            zIndex: 2,
            backgroundColor: 'transparent',
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
          pt: 1, // 添加顶部内边距
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start', // 顶部对齐
          height: '100%', // 确保高度为100%
        }}>
          <TableDisplay tableInfo={tupleData[currentIndex]} />
        </Box>

        <IconButton
          onClick={handleNext}
          sx={{
            position: 'absolute',
            right: 0,
            zIndex: 2,
            backgroundColor: 'transparent',
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
