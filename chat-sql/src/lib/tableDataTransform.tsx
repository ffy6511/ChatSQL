// 用于将JSON格式的元组可视化

import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface TableData {
  tableName: string;
  tupleData: Record<string, any>[];
}

export const transformTableData = (jsonData: TableData[]) => {
  return jsonData.map((tableInfo) => {
    const columns = tableInfo.tupleData.length > 0
      ? Object.keys(tableInfo.tupleData[0])
      : [];

    return (
      <Box key={tableInfo.tableName} sx={{ mb: 2, maxHeight: 400, overflow: 'hidden' }}>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader sx={{ minWidth: 650 }} aria-label={`${tableInfo.tableName} table`}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      maxWidth: 100,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableInfo.tupleData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      sx={{
                        maxWidth: '1em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >{row[column]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  });
};