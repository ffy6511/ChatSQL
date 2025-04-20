'use client'

import React from 'react';
import { Box } from '@mui/material';
import DatabaseFlow from './DatabaseFlow';
import TupleViewer from './TupleViewer';
import { useLLMContext } from '@/contexts/LLMContext';
import { parseJSONToTables } from '@/lib/parseMySQL';

export const Container: React.FC = () => {
  const { llmResult } = useLLMContext();
  
  const tables = llmResult?.data?.outputs?.tableStructure 
    ? parseJSONToTables(llmResult.data.outputs.tableStructure)
    : [];

  return (
    <Box sx={{
      display: 'flex',
      width: '100%',
      height: '100%',
      gap: 2
    }}>
      <Box sx={{
        flex: '1 1 60%',
        minWidth: 0,
        height: '100%'
      }}>
        <DatabaseFlow tables={tables} styles={{ height: '100%' }} />
      </Box>
      <Box sx={{
        flex: '1 1 40%',
        minWidth: 0,
        height: '100%',
        overflowY: 'auto'
      }}>
        <TupleViewer />
      </Box>
    </Box>
  );
};

export default Container;
