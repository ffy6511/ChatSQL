'use client'

import { Box } from '@mui/material';
import { transformTableData } from '@/lib/tableDataTransform';
import { useLLMContext } from '@/contexts/LLMContext';

export default function TupleViewer() {
  const { llmResult } = useLLMContext();
  
  const tupleData = llmResult?.data?.outputs?.tuples || [];

  return (
    <Box sx={{ p: 2 }}>
      {transformTableData(tupleData)}
    </Box>
  );
}
