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

const EntityListView: React.FC = () => {
  const { state, deleteEntity, setSelectedElement, updateAttribute } = useERDiagramContext();
  const entities = state.diagramData?.entities || [];
  const [expandedEntities, setExpandedEntities] = useState<string[]>([]);
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);

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
    updateAttribute(entityId, attributeId, { dataType });
  };

  // 数据类型选项
  const dataTypeOptions = [
    'VARCHAR(50)',
    'VARCHAR(100)',
    'VARCHAR(255)',
    'INT',
    'BIGINT',
    'DECIMAL(10,2)',
    'DECIMAL(5,2)',
    'BOOLEAN',
    'DATE',
    'DATETIME',
    'TIMESTAMP',
    'TEXT',
    'LONGTEXT'
  ];

  const renderAttributeItem = (attribute: ERAttribute, entityId: string) => {
    const isEditing = editingAttribute === attribute.id;
    const isWeakEntity = entities.find(e => e.id === entityId)?.isWeakEntity;

    return (
      <Box
        key={attribute.id}
        sx={{
          p: 1.5,
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
              sx={{ flex: 1, cursor: 'pointer' }}
              onClick={() => setEditingAttribute(attribute.id)}
            >
              {attribute.name}
            </Typography>
          )}

          {/* 主键标识移到右侧，优化样式 */}
          <Chip
            label={isWeakEntity ? 'DIS' : 'PK'}
            size="small"
            variant={attribute.isPrimaryKey ? 'filled' : 'outlined'}
            color={attribute.isPrimaryKey ? 'error' : 'default'}
            clickable
            onClick={() => handleAttributeKeyChange(entityId, attribute.id, !attribute.isPrimaryKey)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: attribute.isPrimaryKey ? 'error.dark' : 'action.hover'
              }
            }}
          />
        </Stack>

        {/* 数据类型编辑 */}
        <Box sx={{ mt: 1 }}>
          <FormControl size="small" fullWidth>
            <Select
              value={attribute.dataType || 'VARCHAR(50)'}
              onChange={(e) => handleAttributeTypeChange(entityId, attribute.id, e.target.value)}
              displayEmpty
            >
              {dataTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
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
                    {entity.isWeakEntity && (
                      <Chip label="弱实体" color="secondary" />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{entity.attributes.length} 个属性</Typography>
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
                  <Divider style={{ margin: '8px 0' }} />
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">属性列表：</Typography>
                    {entity.attributes.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">暂无属性</Typography>
                    ) : (
                      entity.attributes.map(attr => renderAttributeItem(attr, entity.id))
                    )}
                  </Stack>
                  {entity.description && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">描述：</Typography>
                      <Typography>{entity.description}</Typography>
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
