'use client'

import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { TableTuple } from '@/types/dify';

interface TableDisplayProps {
  tableInfo: TableTuple;
}

const TableDisplay: React.FC<TableDisplayProps> = ({ tableInfo }) => {
  // 添加防御性检查，确保 tableInfo 和 tableInfo.tupleData 存在
  const tupleData = tableInfo?.tupleData || [];
  
  const columns: GridColDef[] = tupleData.length > 0
    ? Object.keys(tupleData[0]).map((key) => ({
        field: key,
        headerName: key,
        flex: 1,
        minWidth: 80,
        align: 'center',
        headerAlign: 'center',
      }))
    : [];

  const rows: GridRowsProp = tupleData.map((row, idx) => ({ id: idx, ...row }));
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });

  return (
    <Box sx={{
      width: '100%',
      height: 'auto', // 改为自适应高度
      overflow: 'hidden',
      borderRadius: '0 0 8px 8px', // 添加底部圆角
      border: '1px solid #e0e0e0', // 添加边框
      borderTop: 'none', // 移除顶部边框，与表名区域连接
    }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 20]}
        // 设置固定高度
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5, page: 0 },
          },
        }}
        sx={{
          border: 'none',
          '.MuiDataGrid-cell': {
            borderColor: 'divider',
          },
          height: '350px', // 设置固定高度
          '& .MuiDataGrid-main': {
            // 确保表格内容区域正确显示
            overflow: 'auto',
          },
          '& .MuiDataGrid-virtualScroller': {
            // 确保虚拟滚动区域正确显示
            overflow: 'auto',
          },
          '& .MuiDataGrid-footerContainer': {
            // 确保页脚区域正确显示
            borderTop: '1px solid #e0e0e0',
          },
        }}
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default TableDisplay;
