'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack,
  Divider,
  Typography,
  Tooltip,
  Collapse,
  TextField,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  TableChart as TableChartIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import { ERAttribute } from '@/types/erDiagram';
import styles from './Inspector.module.css';

// 数据类型参数配置
const dataTypeParamConfig: Record<string, { paramCount: number; paramLabels: string[] }> = {
  VARCHAR: { paramCount: 1, paramLabels: ['长度'] },
  char: { paramCount: 1, paramLabels: ['长度'] },
  CHAR: { paramCount: 1, paramLabels: ['长度'] },
  NUMERIC: { paramCount: 2, paramLabels: ['精度', '小数位'] },
  'DOUBLE PRECISION': { paramCount: 0, paramLabels: [] },
  // 其他类型如有需要可继续添加
};

const EntityListView: React.FC = () => {
  const { state, deleteEntity, setSelectedElement, updateAttribute } = useERDiagramContext();
  const entities = state.diagramData?.entities || [];
  const [expandedEntities, setExpandedEntities] = useState<string[]>([]);
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  // 用于临时存储每个属性的参数输入
  const [attributeParams, setAttributeParams] = useState<{ [attrId: string]: string[] }>({});

  // 顶层 useEffect 初始化 attributeParams(避免前后属性改变后hook调用 的数量差异)
  React.useEffect(() => {
    const newParams: { [attrId: string]: string[] } = {};
    entities.forEach(entity => {
      entity.attributes.forEach(attribute => {
        let typeName = attribute.dataType || 'VARCHAR';
        let params: string[] = [];
        const match = typeName.match(/^(\w+)(?:\((.*)\))?$/);
        if (match) {
          typeName = match[1];
          if (match[2]) {
            params = match[2].split(',').map(s => s.trim());
          }
        }
        if (dataTypeParamConfig[typeName] && !attributeParams[attribute.id]) {
          newParams[attribute.id] = params.length ? params : Array(dataTypeParamConfig[typeName].paramCount).fill('');
        }
      });
    });
    if (Object.keys(newParams).length > 0) {
      setAttributeParams(prev => ({ ...prev, ...newParams }));
    }
  }, [entities]);

  // 处理展开/收起
  const handleExpand = (entityId: string) => {
    setExpandedEntities(prev =>
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  // 根据selectedElementId自动展开对应实体
  React.useEffect(() => {
    if (state.selectedElementId && entities.find(e => e.id === state.selectedElementId)) {
      setExpandedEntities(prev =>
        prev.includes(state.selectedElementId!)
          ? prev
          : [...prev, state.selectedElementId!]
      );
    }
  }, [state.selectedElementId, entities]);

  const handleAttributeNameChange = (entityId: string, attributeId: string, newName: string) => {
    updateAttribute(entityId, attributeId, { name: newName });
  };

  const handleAttributeKeyChange = (entityId: string, attributeId: string, isPrimaryKey: boolean) => {
    updateAttribute(entityId, attributeId, { isPrimaryKey });
  };

  const handleAttributeTypeChange = (entityId: string, attributeId: string, dataType: string) => {
    // 切换类型时，初始化参数输入
    if (dataTypeParamConfig[dataType]) {
      setAttributeParams(prev => ({
        ...prev,
        [attributeId]: Array(dataTypeParamConfig[dataType].paramCount).fill('')
      }));
    } else {
      setAttributeParams(prev => ({ ...prev, [attributeId]: [] }));
    }
    // 先只存类型名，参数后续拼接
    updateAttribute(entityId, attributeId, { dataType });
  };

  // 新增：参数输入变化时，拼接类型字符串并更新
  const handleParamChange = (entityId: string, attributeId: string, idx: number, value: string) => {
    setAttributeParams(prev => {
      const params = [...(prev[attributeId] || [])];
      params[idx] = value;
      // 拼接类型字符串
      const attr = entities.flatMap(e => e.attributes).find(a => a.id === attributeId);
      let type = attr?.dataType || 'VARCHAR';
      // 只取类型名部分（去掉可能已有的括号参数）
      type = type.split('(')[0];
      const config = dataTypeParamConfig[type];
      const paramArr = params.slice(0, config?.paramCount || 0).filter(Boolean);
      const typeStr = paramArr.length ? `${type}(${paramArr.join(',')})` : type;
      updateAttribute(entityId, attributeId, { dataType: typeStr });
      return { ...prev, [attributeId]: params };
    });
  };

  // 数据类型选项
  const dataTypeOptions = [
    'char',
    'VARCHAR',
    'INT',
    'SMALLINT',
    'NUMERIC',
    'FLOAT',
    'DOUBLE PRECISION',
    'BOOLEAN',
    'DATE',
    'TIME',
    'TIMESTAMP',
    'INTERVAL',
    'ENUM'
  ];

  const renderAttributeItem = (attribute: ERAttribute, entityId: string) => {
    const isEditing = editingAttribute === attribute.id;
    const isWeakEntity = entities.find(e => e.id === entityId)?.isWeakEntity;
    // 解析当前类型和参数
    let typeName = attribute.dataType || 'VARCHAR';
    let params: string[] = [];
    const match = typeName.match(/^(\w+)(?:\((.*)\))?$/);
    if (match) {
      typeName = match[1];
      if (match[2]) {
        params = match[2].split(',').map(s => s.trim());
      }
    }
    return (
      <Box
        key={attribute.id}
        sx={{
          p: 1,
          borderLeft: '4px solid',
          borderLeftColor: 'primary.light',
          borderRadius: 1,
          mb: 1,
          bgcolor: 'background.paper'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {isEditing ? (
            <TextField
              size="small"
              value={attribute.name}
              onChange={(e) => handleAttributeNameChange(entityId, attribute.id, e.target.value)}
              onBlur={() => setEditingAttribute(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingAttribute(null);
                }
              }}
              autoFocus
              sx={{ flex: 1 }}
            />
          ) : (
            <Typography
              fontWeight="bold"
              sx={{ flex: 1, cursor: 'pointer'}}
              onClick={() => setEditingAttribute(attribute.id)}
            >
              {attribute.name}
            </Typography>
          )}

        {/* 数据类型编辑 */}
        <Box sx={{ minWidth: 100, display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" fullWidth>
            <Select
              value={typeName}
              onChange={(e) => handleAttributeTypeChange(entityId, attribute.id, e.target.value)}
              displayEmpty
              sx = {{fontSize:'0.8em', fontWeight:'600'}}
            >
              {dataTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* 动态渲染参数输入框 */}
          {dataTypeParamConfig[typeName] && dataTypeParamConfig[typeName].paramLabels.map((label, idx) => (
            <TextField
              key={label}
              label={label}
              value={attributeParams[attribute.id]?.[idx] || ''}
              onChange={e => handleParamChange(entityId, attribute.id, idx, e.target.value)}
              size="small"
              sx={{ width: 90, ml: 1, fontSize:'0.9em' }}
            />
          ))}
        </Box>

          {/* 主键标识移到右侧，优化样式 */}
          <Chip
            label={isWeakEntity ? 'DIS' : 'PK'}
            size="small"
            variant={attribute.isPrimaryKey ? 'filled' : 'outlined'}
            clickable
            onClick={() => handleAttributeKeyChange(entityId, attribute.id, !attribute.isPrimaryKey)}
            sx={{
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              background: attribute.isPrimaryKey ? isWeakEntity ? '#e3f2fd' : '#ffeaea' : 'var(--card-border)',
              // 只改 label 字体颜色
              '& .MuiChip-label': {
                color: attribute.isPrimaryKey ? isWeakEntity ? '#1976d2' : '#D3302F': 'var(--secondary-text)',
                fontWeight: 'bold',
                // fontSize: 13,
                letterSpacing: '1px',
              },
              '&:hover': {
                opacity: 0.8,
                transition: 'all 0.2s ease'
              }
            }}
          />
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TableChartIcon /> 实体列表
      </Typography>
      <Divider sx={{ my: 1 }} />
      {entities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">暂无实体</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {entities.map((entity) => (
            <Card
              key={entity.id}
              className={`${styles.entityCard} ${state.selectedElementId === entity.id ? styles.selected : ''}`}
              sx={{ border: 1, borderColor: 'primary.light', '&:hover': { borderColor: 'primary.main', boxShadow: 1 } }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={() => handleExpand(entity.id)}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {expandedEntities.includes(entity.id) ?
                      <ExpandMoreIcon /> :
                      <ExpandLessIcon />
                    }
                    <Typography fontWeight="bold">{entity.name}</Typography>
                    {/* {entity.isWeakEntity && (
                      <Chip label="弱实体" color="secondary" />
                    )} */}
                  </Stack>
                  <Typography variant="body2" color="var(--secondary-text)">{entity.attributes.length} attributes</Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="编辑">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement(entity.id);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntity(entity.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Collapse in={expandedEntities.includes(entity.id)} timeout="auto" unmountOnExit>
                <CardContent>
                  <Stack spacing={0}>
                    {entity.attributes.length === 0 ? (
                      <Typography variant="body2" color="var(--secondary-text)">暂无属性</Typography>
                    ) : (
                      entity.attributes.map(attr => renderAttributeItem(attr, entity.id))
                    )}
                  </Stack>
                  {entity.description && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="var(--secondary-text)">描述：</Typography>
                      <Typography variant="body2" color="var(--primary-text)" sx={{ ml: 2}}>{entity.description}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1, borderLeft: 3, borderColor: 'primary.main' }}>
        <Typography variant="body2" color="text.secondary">从组件库添加实体后，将在此处显示</Typography>
        <Typography variant="body2" color="text.secondary">点击实体可展开查看和编辑属性</Typography>
      </Box>
    </Box>
  );
};

export default EntityListView;
