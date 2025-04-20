import { Box, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp, GridPaginationModel } from '@mui/x-data-grid';
import { useState } from 'react';
import { TableTuple } from '@/types/dify';

export const transformTableData = (jsonData: TableTuple[]) => {
  return jsonData.map((tableInfo) => {
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
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    return (
      <Box key={tableInfo.tableName} sx={{ mb: 2, maxHeight: 400, overflow: 'hidden' }}>
        {/* 控制表格的高度限制 */}
        <Paper sx={{ height: 300, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            autosizeOnMount = {true}
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20]}
            // checkboxSelection
            onRowSelectionModelChange={(newSelection) => {
              setSelectedRows(rows.filter(row => newSelection.includes(row.id)));
            }}
            sx={{ border: 0 }}
            disableRowSelectionOnClick
            autoHeight={false}
          />
        </Paper>
      </Box>
    );
  });
};