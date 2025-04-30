'use client'

import React, { useEffect } from 'react';
import { Box, Paper, Typography, Button, Tooltip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { KeyboardCommandKey, KeyboardReturn } from '@mui/icons-material';
import styles from './QueryResultTable.module.css';
import { useCompletionContext } from '@/contexts/CompletionContext';

interface QueryResultTableProps {
  data: any[];
}

const QueryResultTable: React.FC<QueryResultTableProps> = ({ data }) => {
  const { checkQueryResult } = useCompletionContext();

  // 添加键盘快捷键处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        checkQueryResult();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [checkQueryResult]);

  // 如果没有数据，显示提示信息而不是返回 null
  if (!data || data.length === 0) {
    return (
      <Box sx={{ mt: 1, height: 400, borderRadius: 1 }}>
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
      </Box>
    );
  }

  const columns: GridColDef[] = Object.keys(data[0]).map((key) => ({
    field: key,
    headerName: key,
    flex: 1,
    minWidth: 130,
    align: 'center',
    headerAlign: 'center',
  }));

  const rows = data.map((row, index) => ({
    id: index,
    ...row
  }));

  return (
    <Box sx={{ mt: 1, height: 400 , borderRadius: 1 }}>
      <Paper sx={{ height: '100%', width: '100%' }}>
        {/* 结果标题区域 */}
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
              onClick={() => checkQueryResult()}
              sx={{ ml: 2 }}
            >
              比较
            </Button>
          </Tooltip>
          <Typography className={styles.resultCount}>
            共 {rows.length} 条记录
          </Typography>
        </div>

        {/* 表格区域 */}
        <div className={styles.tableContainer}>
          <DataGrid
            rows={rows}
            columns={columns}
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
    </Box>
  );
};

export default QueryResultTable;
