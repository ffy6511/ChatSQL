'use client'

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AssessmentIcon from '@mui/icons-material/Assessment';
import styles from './QueryResultTable.module.css';

interface QueryResultTableProps {
  data: any[];
}

const QueryResultTable: React.FC<QueryResultTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
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
    <Box sx={{ mt: 2, height: 400 }}>
      <Paper sx={{ height: '100%', width: '100%' }}>
        {/* 结果标题区域 */}
        <div className={styles.resultHeader}>
          <AssessmentIcon className={styles.resultIcon} />
          <Typography className={styles.resultTitle}>
            查询结果
          </Typography>
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