'use client'

import React, { useState, useMemo } from 'react';
import { Box, SpeedDial, SpeedDialIcon, SpeedDialAction, Tooltip } from '@mui/material';
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

  // 只在 tableStructure 变化时更新 tables
  const tables = useMemo(() => {
    if (!llmResult?.data?.outputs?.tableStructure) {
      return [];
    }
    return parseJSONToTables(llmResult.data.outputs.tableStructure.map(table => ({
      tableName: table.tableName,
      columns: table.columns,
      foreignKeys: table.foreignKeys
    })));
  }, [llmResult?.data?.outputs?.tableStructure]);

  // 使用 useMemo 包装渲染内容，避免不必要的重渲染
  const schemaContent = useMemo(() => (
    <Box sx={{ height: '100%' }}>
      <DatabaseFlow tables={tables} styles={{ height: '100%' }} />
    </Box>
  ), [tables]);

  const actions = [
    { icon: <SchemaIcon />, name: '数据库结构', value: 'schema' },
    { icon: <TableChartIcon />, name: '元组表格', value: 'data' },
  ];

  return (
    <Box sx={{
      display: 'flex',
      width: '100%',
      height: '100%',
      gap: 1,
      position: 'relative',
    }}>
      {/* 左侧区域 */}
      <Box sx={{
        flex: '1 1 60%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '8px',
      }}>
        {/* SpeedDial 切换按钮 */}
        <SpeedDial
          ariaLabel="视图切换"
          sx={{
            position: 'absolute',
            bottom: 16, // 改为 bottom
            left: 6,
            '& .MuiSpeedDial-fab': {
              width: 30,
              height: 30,
              color: 'text.secondary',
              backgroundColor: 'transparent',
              boxShadow: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            },
          }}
          icon={<SpeedDialIcon />}
          direction="right"
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.value}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => setViewMode(action.value as ViewMode)}
              sx={{
                backgroundColor: viewMode === action.value ? 'primary.main' : 'background.paper',
                width: '36px', // 设置按钮宽度
                height: '36px', // 设置按钮高度
                '& .MuiSvgIcon-root': {
                  color: viewMode === action.value ? 'white' : 'inherit',
                  fontSize: '20px', // 设置图标大小
                },
                '& .MuiFab-root': { // 设置内部 Fab 按钮的大小
                  width: '20px',
                  height: '20px',
                  minHeight: 'unset',
                }
              }}
            />
          ))}
        </SpeedDial>

        {/* 内容区域 */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          minHeight: 0,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          overflow: 'auto',
          mt: 0, 
        }}>
          {viewMode === 'schema' ? schemaContent : (
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
        borderRadius: '8px',
        overflow: 'auto',
        border: '1px solid rgba(71, 70, 70, 0.12)', // 添加边框使圆角更明显
      }}>
        <ProblemViewer />
      </Box>
    </Box>
  );
};

export default Container;
