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
  MenuItem,
  Menu,
  Button,
  Autocomplete
} from '@mui/material';
import {
  TableChart as TableChartIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import { ERAttribute } from '@/types/ERDiagramTypes/erDiagram';
import {
  dataTypeParamConfig,
  dataTypeOptions,
  parseDataType,
  buildDataType,
  getDefaultParams
} from '@/types/ERDiagramTypes/dataTypes';
import styles from './Inspector.module.css';

const EntityListView: React.FC = () => {
  const { state, deleteEntity, setSelectedElement, updateAttribute, addAttribute, deleteAttribute } = useERDiagramContext();
  const entities = state.diagramData?.entities || [];
  const [expandedEntities, setExpandedEntities] = useState<string[]>([]);
  // 用于临时存储每个属性的参数输入 和 属性名的输入
  const [attributeParams, setAttributeParams] = useState<{ [attrId: string]: string[] }>({});
  const [editingAttributeNames, setEditingAttributeNames] = useState<{ [attrId: string]: string }>({});
  // 中文输入法状态管理
  const [isComposing, setIsComposing] = useState<{ [attrId: string]: boolean }>({});
  // 属性操作菜单状态
  const [attributeMenuAnchor, setAttributeMenuAnchor] = useState<{ [attrId: string]: HTMLElement | null }>({});

  // 生成新属性的辅助函数
  const generateNewAttribute = (): ERAttribute => {
    const timestamp = Date.now();
    return {
      id: `attr_${timestamp}`,
      name: '新属性',
      dataType: 'int',
      isPrimaryKey: false,
      isRequired: false,
      description: ''
    };
  };

  // 添加属性处理函数
  const handleAddAttribute = async (entityId: string) => {
    const newAttribute = generateNewAttribute();
    await addAttribute(entityId, newAttribute);
  };

  // 属性菜单处理函数
  const handleAttributeMenuOpen = (event: React.MouseEvent<HTMLElement>, attributeId: string) => {
    event.stopPropagation();
    setAttributeMenuAnchor(prev => ({ ...prev, [attributeId]: event.currentTarget }));
  };

  const handleAttributeMenuClose = () => {
    setAttributeMenuAnchor({});
  };

  const handleDeleteAttributeFromMenu = async (entityId: string, attributeId: string) => {
    handleAttributeMenuClose();
    await deleteAttribute(entityId, attributeId);
  };

  // 参数编辑相关处理函数
  const handleParamChange = async (entityId: string, attributeId: string, paramIndex: number, value: string, typeName: string) => {
    // 获取当前属性的参数
    const entity = entities.find(e => e.id === entityId);
    const attribute = entity?.attributes.find(attr => attr.id === attributeId);
    if (!attribute) return;

    const { params: currentParams } = parseDataType(attribute.dataType || '');

    // 更新指定索引的参数
    const newParams = [...currentParams];
    newParams[paramIndex] = value;

    // 构建新的数据类型字符串
    const newDataType = buildDataType(typeName, newParams);

    // 保存更新
    await updateAttribute(entityId, attributeId, { dataType: newDataType });
  };

  // 顶层 useEffect 初始化 attributeParams(避免前后属性改变后hook调用 的数量差异)
  React.useEffect(() => {
    const newParams: { [attrId: string]: string[] } = {};
    entities.forEach(entity => {
      entity.attributes.forEach(attribute => {
        const { typeName, params } = parseDataType(attribute.dataType || 'VARCHAR');

        if (dataTypeParamConfig[typeName] && !attributeParams[attribute.id]) {
          newParams[attribute.id] = params.length ? params : getDefaultParams(typeName);
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

  const handleAttributeNameChange = (attributeId: string, newName: string) => {
    // 只更新临时状态，不立即保存
    setEditingAttributeNames(prev => ({ ...prev, [attributeId]: newName }));
  };

  const handleAttributeNameSave = async (entityId: string, attributeId: string) => {
    // 如果正在输入中文，不保存
    if (isComposing[attributeId]) {
      return;
    }

    const newName = editingAttributeNames[attributeId];
    if (newName !== undefined) {
      // 如果名称为空，使用默认值
      const finalName = newName.trim() || '未命名属性';
      await updateAttribute(entityId, attributeId, { name: finalName });

      // 清除临时状态
      setEditingAttributeNames(prev => {
        const newState = { ...prev };
        delete newState[attributeId];
        return newState;
      });
    }
  };

  const handleCompositionStart = (attributeId: string) => {
    setIsComposing(prev => ({ ...prev, [attributeId]: true }));
  };

  const handleCompositionEnd = (attributeId: string) => {
    setIsComposing(prev => ({ ...prev, [attributeId]: false }));
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



  // 数据类型选项已从 @/types/dataTypes 导入

  const renderAttributeItem = (attribute: ERAttribute, entityId: string) => {
    const isWeakEntity = entities.find(e => e.id === entityId)?.isWeakEntity;
    // 解析当前类型和参数
    const { typeName } = parseDataType(attribute.dataType || 'VARCHAR');
    return (
      <Box
        key={attribute.id}
        sx={{
          p: 1,
          borderRadius: 1,
          mb: 1,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx = {{ overflow: 'hidden', flexWrap: 'nowrap'}}>
          <Box sx = {{flexGrow: 1, display: 'flex', gap: 1}}>
            <TextField
              size="small"
              value={editingAttributeNames[attribute.id] !== undefined ? editingAttributeNames[attribute.id] : attribute.name}
              onChange={(e) => handleAttributeNameChange(attribute.id, e.target.value)}
              onBlur={() => handleAttributeNameSave(entityId, attribute.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isComposing[attribute.id]) {
                  e.preventDefault();
                  handleAttributeNameSave(entityId, attribute.id);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              onCompositionStart={() => handleCompositionStart(attribute.id)}
              onCompositionEnd={() => handleCompositionEnd(attribute.id)}
              variant="outlined"
              placeholder="属性名称"
              sx={{
                maxWidth: '100px',
                '& .MuiInputBase-input': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.8em',
                }
              }}
            />

            {/* 数据类型编辑 */}
            <Autocomplete
              disableClearable
              size="small"
              value={typeName}
              onChange={(_, newValue) => {
                if (newValue) {
                  handleAttributeTypeChange(entityId, attribute.id, newValue);
                }
              }}
              options={dataTypeOptions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  sx={{
                    maxWidth: '180px',
                    '& .MuiInputBase-input': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8em',
                    }
                  }}
                />
              )}
              sx={{ minWidth: '140px' }}
            />

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

          {/* 属性操作菜单 */}
          <Tooltip title="属性操作">
            <IconButton
              size="small"
              onClick={(e) => handleAttributeMenuOpen(e, attribute.id)}
              sx={{
                opacity: 0.6,
                '&:hover': {
                  opacity: 1,
                  backgroundColor: 'var(--hover-bg)'
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* 属性操作菜单 */}
        <Menu
          anchorEl={attributeMenuAnchor[attribute.id]}
          open={Boolean(attributeMenuAnchor[attribute.id])}
          onClose={handleAttributeMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {/* 根据数据类型显示参数编辑选项 */}
          {dataTypeParamConfig[typeName] && (
            <div>
              {dataTypeParamConfig[typeName].paramLabels.map((label, idx) => {
                // 解析当前参数值
                const { params: currentParams } = parseDataType(attribute.dataType || '');
                const currentValue = currentParams[idx] || '';

                return (
                  <MenuItem key={label} sx={{ flexDirection: 'column', alignItems: 'stretch', py: 1 }}>
                    <TextField
                      label={label}
                      size="small"
                      value={currentValue}
                      onChange={(e) => handleParamChange(entityId, attribute.id, idx, e.target.value, typeName)}
                      onClick={(e) => e.stopPropagation()} // 防止点击输入框时关闭菜单
                      sx={{
                        minWidth: '120px',
                        '& .MuiInputBase-input': {
                          fontSize: '0.8em'
                        }
                      }}
                    />
                  </MenuItem>
                );
              })}
              <Divider />
            </div>
          )}

          <MenuItem
            onClick={() => handleDeleteAttributeFromMenu(entityId, attribute.id)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            删除
          </MenuItem>
        </Menu>


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

                    {/* 添加属性按钮 */}
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddAttribute(entity.id);
                        }}
                        sx={{
                          color: 'var(--secondary-text)',
                          '&:hover': {
                            color: 'var(--primary-text)',
                            backgroundColor: 'var(--hover-bg)'
                          }
                        }}
                      >
                        添加属性
                      </Button>
                    </Box>
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
