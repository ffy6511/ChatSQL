'use client'

import { Box, Typography } from '@mui/material';
import { useLLMContext } from '@/contexts/LLMContext';
import TableDisplay from './TableDisplay';

export default function TupleViewer() {
  const { llmResult } = useLLMContext();

  const tupleData = llmResult?.data?.outputs?.tuples || [];

  return (
    <Box sx={{ p: 2 }}>
      {tupleData.length > 0 ? (
        tupleData.map((tableInfo, index) => (
          <TableDisplay key={`${tableInfo.tableName}-${index}`} tableInfo={tableInfo} />
        ))
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          暂无数据
        </Typography>
      )}
    </Box>
  );
}
