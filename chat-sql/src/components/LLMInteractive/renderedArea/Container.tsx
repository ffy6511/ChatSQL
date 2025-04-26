'use client'

import React, { useState } from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import DatabaseFlow from './DatabaseFlow';
import TupleViewer from './TupleViewer';
import ProblemViewer from './ProblemViewer';
import { useLLMContext } from '@/contexts/LLMContext';
import { parseJSONToTables } from '@/lib/parseMySQL';
import SchemaIcon from '@mui/icons-material/Schema';
import TableChartIcon from '@mui/icons-material/TableChart';

type ViewMode = 'schema' | 'data';

export const Container: React.FC = () => {
  const { llmResult } = useLLMContext();
  const [viewMode, setViewMode] = useState<ViewMode>('schema');

  const tables = llmResult?.data?.outputs?.tableStructure
    ? parseJSONToTables(llmResult.data.outputs.tableStructure)
    : [];

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      width: '100%',
      height: '100%',
      gap: 1,
    }}>
      {/* 左侧区域 */}
      <Box sx={{
        flex: '1 1 60%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        height: '100%',
        overflow: 'hidden', // 确保内容不会溢出
      }}>
        {/* 切换按钮 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          p: 1,
        }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="schema" aria-label="schema view">
              <SchemaIcon sx={{ mr: 2 }} />
              数据库结构
            </ToggleButton>
            <ToggleButton value="data" aria-label="data view">
              <TableChartIcon sx={{ mr: 2 }} />
              元组表格
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* 内容区域 */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          minHeight: 0,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          overflow: 'auto', // 允许内容滚动
        }}>
          {viewMode === 'schema' ? (
            <Box sx={{ height: '100%' }}>
              <DatabaseFlow tables={tables} styles={{ height: '100%' }} />
            </Box>
          ) : (
            <Box sx={{ height: '100%' }}>
              <TupleViewer />
            </Box>
          )}
        </Box>
      </Box>

      {/* 右侧区域 */}
      <Box sx={{
        flex: '1 1 40%',
        minWidth: '300px',
        maxWidth: '500px',
        height: '100%',
        backgroundColor: 'transparent',
        borderRadius: 3,
        overflow: 'auto',
      }}>
        <ProblemViewer />
      </Box>
    </Box>
  );
};

export default Container;
