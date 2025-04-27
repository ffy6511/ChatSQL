'use client'

import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { TableTuple } from '@/types/dify';

interface TableDisplayProps {
  tableInfo: TableTuple;
}

const TableDisplay: React.FC<TableDisplayProps> = ({ tableInfo }) => {
  const columns: GridColDef[] = tableInfo.tupleData.length > 0
    ? Object.keys(tableInfo.tupleData[0]).map((key) => ({
        field: key,
        headerName: key,
        flex: 1,
        minWidth: 80,
        align: 'center',
        headerAlign: 'center',
      }))
    : [];
  
  const rows: GridRowsProp = tableInfo.tupleData.map((row, idx) => ({ id: idx, ...row }));
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 20]}
        sx={{
          border: 'none',
          '.MuiDataGrid-cell': {
            borderColor: 'divider',
          },
          height: '100%',
        }}
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default TableDisplay;
