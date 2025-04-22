'use client'

import React from 'react';
import { Box, Paper } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

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
          autoHeight={false}
          sx={{ border: 0 }}
        />
      </Paper>
    </Box>
  );
};

export default QueryResultTable;