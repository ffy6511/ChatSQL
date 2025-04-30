'use client'

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Tooltip, Fade, Zoom, rgbToHex } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { KeyboardCommandKey } from '@mui/icons-material';
import { message as antdMessage } from 'antd';
import styles from './QueryResultTable.module.css';
import { useCompletionContext } from '@/contexts/CompletionContext';
import { DataGrid } from '@mui/x-data-grid';

interface QueryResultTableProps {
  data: any[];
}

const QueryResultTable: React.FC<QueryResultTableProps> = ({ data }) => {
  const { checkQueryResult } = useCompletionContext();
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const [showSuccess, setShowSuccess] = useState(false);

  // 包装检查结果函数
  const handleCheckResult = async () => {
    try {
      const isMatch = checkQueryResult();
      if (isMatch) {
        setShowSuccess(true);
        messageApi.success('查询结果正确！');
        // 2秒后隐藏成功动画
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        messageApi.info('未找到匹配的查询结果，请检查你的SQL语句');
      }
    } catch (error) {
      console.error('Check result error:', error);
      messageApi.error('比较过程中发生错误，请重试');
    }
  };

  // 添加键盘快捷键处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        handleCheckResult();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleCheckResult]);

  return (
    <Box sx={{ mt: 1, height: 400, borderRadius: 1, position: 'relative' }}>
      {contextHolder}
      
      {/* 成功动画效果 */}
      <Fade in={showSuccess}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Zoom in={showSuccess}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 50,
                  color: 'success.main',
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                    '50%': {
                      transform: 'scale(1.1)',
                      opacity: 0.8,
                    },
                    '100%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                  },
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  color: 'success.main',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(76, 175, 80, 0.3)',
                }}
              >
                Matched!
              </Typography>
            </Box>
          </Zoom>
        </Box>
      </Fade>

      {/* 如果没有数据，显示提示信息 */}
      {(!data || data.length === 0) ? (
        <Paper 
          sx={{ 
            height: '100%', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            暂无查询结果
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请执行查询语句获取数据
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ height: '100%', width: '100%' }}>
          <div className={styles.resultHeader}>
            <AssessmentIcon className={styles.resultIcon} />
            <Typography className={styles.resultTitle}>
              查询结果
            </Typography>
            <Tooltip
              title={
                <div className="shortcut-tooltip">
                  <span>比较结果 </span>
                  (<KeyboardCommandKey className="shortcut-icon" />
                  <span className="shortcut-plus">+</span>
                  <span>J</span>)
                </div>
              }
              arrow
              placement="top"
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<CompareArrowsIcon />}
                onClick={handleCheckResult}
                sx={{ ml: 2 }}
              >
                比较
              </Button>
            </Tooltip>
            <Typography className={styles.resultCount}>
              共 {data.length} 条记录
            </Typography>
          </div>
          
          {/* 表格区域 */}
          <div className={styles.tableContainer}>
            <DataGrid
              rows={data.map((row, index) => ({ id: index, ...row }))}
              columns={Object.keys(data[0]).map((key) => ({
                field: key,
                headerName: key,
                flex: 1,
                minWidth: 130,
                align: 'center',
                headerAlign: 'center',
              }))}
              pagination
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 5, page: 0 },
                },
              }}
              sx={{
                border: 0,
                height: '100%'
              }}
            />
          </div>
        </Paper>
      )}
    </Box>
  );
};

export default QueryResultTable;
