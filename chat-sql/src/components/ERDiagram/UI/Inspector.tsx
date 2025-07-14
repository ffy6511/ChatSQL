'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  Typography,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Apps as AppsIcon,
  TableChart as TableChartIcon,
  Share as ShareIcon,
  BorderAll as BorderAllIcon,
  Diamond as DiamondIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import PropertyEditor from './PropertyEditor';
import { EREntity, ERRelationship } from '@/types/erDiagram';
import styles from './Inspector.module.css';

type ActiveTab = 'components' | 'entities' | 'relationships';

interface InspectorProps {
  activeTab: ActiveTab;
}

const ComponentsView: React.FC = () => {
  const handleDragStart = (event: React.DragEvent, componentType: string) => {
    event.dataTransfer.setData('application/reactflow', componentType);
    event.dataTransfer.effectAllowed = 'move';
    (event.currentTarget as HTMLElement).style.opacity = '0.5';
  };
  const handleDragEnd = (event: React.DragEvent) => {
    (event.currentTarget as HTMLElement).style.opacity = '1';
  };
  const components = [
    {
      id: 'strong-entity',
      name: 'Strong entity set',
      icon: BorderAllIcon,
      type: 'entity',
      description: 'an entity type that can exist independently and has its own primary key',
      color: '#448fd6', // 蓝色
    },
    {
      id: 'weak-entity',
      name: 'Weak entity set',
      icon: BorderAllIcon,
      type: 'entity',
      description: 'its existence depends on another (strong) entity set',
      color: '#bd62eb', // 紫色
    },
    {
      id: 'relationship',
      name: 'Relationship',
      icon: DiamondIcon,
      type: 'diamond',
      description: 'represents a connection or association between different entity sets',
      color: '#ebcd62', // 绿色
    },
  ];
  return (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AppsIcon sx={{ color: '#1976d2', mr: 1 }} /> Component Library
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={1} sx={{ mb: 2 }}>
        {components.map((component) => (
          <Card
            key={component.id}
            sx={{
              cursor: 'grab',
              borderLeft: `6px solid ${component.color}`,
              borderRadius: 2,
              height: 80,
              bgcolor:'var(--component-card)' 
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, component.type)}
            onDragEnd={handleDragEnd}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 , p:1}}>
              <component.icon sx={{ color: component.color }} />
              <Box>
                <Typography fontWeight="bold" color='var(--primary-text)'>{component.name}</Typography>
                <Typography variant="body2" color="var(--secondary-text)">{component.description}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, borderLeft: 3,  bgcolor:'var(--card-border)'  }}>
        <Typography variant="body2" color="var(--secondary-text)">Drag and drop the component on the canvas.. </Typography>
        <Typography variant="body2" color="var(--secondary-text)">Double-click the node on the canvas to edit the name.</Typography>
      </Box>
    </Box>
  );
};

const EntitiesView: React.FC = () => {
  const { state, deleteEntity, setSelectedElement } = useERDiagramContext();
  const entities = state.diagramData?.entities || [];
  const [expandedEntities, setExpandedEntities] = useState<string[]>([]);

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

  const renderAttributeItem = (attribute: any, entityId: string) => (
    <div key={attribute.id} className={styles.attributeItem}>
      <div className={styles.attributeInfo}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {attribute.isPrimaryKey && (
            <KeyIcon color="error" />
          )}
          <Typography fontWeight="bold">{attribute.name}</Typography>
          {attribute.isPrimaryKey && (
            <Chip label={entities.find(e => e.id === entityId)?.isWeakEntity ? 'DIS' : 'PK'} color="error" />
          )}
          {attribute.isRequired && (
            <Chip label="必填" color="warning" />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">{attribute.dataType}</Typography>
      </div>
    </div>
  );

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

const RelationshipsView: React.FC = () => {
  const { state, deleteRelationship, setSelectedElement } = useERDiagramContext();
  const relationships = state.diagramData?.relationships || [];
  const entities = state.diagramData?.entities || [];
  const [expandedRelationships, setExpandedRelationships] = useState<string[]>([]);

  // 处理展开/收起
  const handleExpand = (relationshipId: string) => {
    setExpandedRelationships(prev =>
      prev.includes(relationshipId)
        ? prev.filter(id => id !== relationshipId)
        : [...prev, relationshipId]
    );
  };

  // 根据selectedElementId自动展开对应关系
  React.useEffect(() => {
    if (state.selectedElementId && relationships.find(r => r.id === state.selectedElementId)) {
      setExpandedRelationships(prev =>
        prev.includes(state.selectedElementId!)
          ? prev
          : [...prev, state.selectedElementId!]
      );
    }
  }, [state.selectedElementId, relationships]);

  // 获取实体名称
  const getEntityName = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    return entity?.name || '未知实体';
  };

  // 判断是否为弱关系
  const isWeakRelationship = (relationship: any) => {
    return relationship.connections.some((connection: any) => {
      const entity = entities.find(e => e.id === connection.entityId);
      return entity?.isWeakEntity === true;
    });
  };

  const renderConnectionItem = (connection: any) => (
    <Box key={connection.entityId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography>{getEntityName(connection.entityId)}</Typography>
      <Chip label={connection.cardinality} color="info" />
      {connection.role && (
        <Typography variant="body2" color="text.secondary">({connection.role})</Typography>
      )}
    </Box>
  );

  const renderAttributeItem = (attribute: any) => (
    <Box key={attribute.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography fontWeight="bold">{attribute.name}</Typography>
      {attribute.isPrimaryKey && (
        <Chip label="PK" color="error" />
      )}
      {attribute.isRequired && (
        <Chip label="必填" color="warning" />
      )}
      <Typography variant="body2" color="text.secondary">{attribute.dataType}</Typography>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShareIcon /> 关系列表
      </Typography>
      <Divider sx={{ my: 1 }} />
      {relationships.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">暂无关系</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {relationships.map((relationship) => (
            <Card
              key={relationship.id}
              className={`${styles.relationshipCard} ${state.selectedElementId === relationship.id ? styles.selected : ''}`}
              sx={{ border: 1, borderColor: 'primary.light', '&:hover': { borderColor: 'primary.main', boxShadow: 1 } }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => handleExpand(relationship.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {expandedRelationships.includes(relationship.id) ?
                      <ExpandMoreIcon /> :
                      <ExpandLessIcon />
                    }
                    <Typography fontWeight="bold">{relationship.name}</Typography>
                    {isWeakRelationship(relationship) && (
                      <Chip label="弱关系" color="secondary" />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{relationship.connections.length} 个连接</Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="编辑">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement(relationship.id);
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
                        deleteRelationship(relationship.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Collapse in={expandedRelationships.includes(relationship.id)} timeout="auto" unmountOnExit>
                <CardContent>
                  <Divider style={{ margin: '8px 0' }} />

                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">连接实体：</Typography>
                    {relationship.connections.map(renderConnectionItem)}
                  </Stack>

                  {relationship.attributes && relationship.attributes.length > 0 && (
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">关系属性：</Typography>
                      {relationship.attributes.map(renderAttributeItem)}
                    </Stack>
                  )}

                  {relationship.description && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">描述：</Typography>
                      <Typography>{relationship.description}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1, borderLeft: 3, borderColor: 'primary.main' }}>
        <Typography variant="body2" color="text.secondary">连接实体和关系后，将在此处显示</Typography>
        <Typography variant="body2" color="text.secondary">可以编辑基数约束和参与约束</Typography>
      </Box>
    </Box>
  );
};

const Inspector: React.FC<InspectorProps> = ({ activeTab }) => {
  const { state, updateEntity, updateRelationship } = useERDiagramContext();

  // 获取选中的元素
  const getSelectedElement = (): EREntity | ERRelationship | null => {
    if (!state.selectedNodeId || !state.diagramData) return null;

    // 先在实体中查找
    const entity = state.diagramData.entities.find(e => e.id === state.selectedNodeId);
    if (entity) return entity;

    // 再在关系中查找
    const relationship = state.diagramData.relationships.find(r => r.id === state.selectedNodeId);
    if (relationship) return relationship;

    return null;
  };

  const selectedElement = getSelectedElement();

  // 如果有选中的节点且处于属性编辑模式，显示属性编辑器
  if (selectedElement && state.nodeEditMode === 'properties') {
    return (
      <Box sx={{ p: 2 }}>
        <PropertyEditor
          selectedElement={selectedElement}
          onUpdateEntity={updateEntity}
          onUpdateRelationship={updateRelationship}
        />
      </Box>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'components':
        return <ComponentsView />;
      case 'entities':
        return <EntitiesView />;
      case 'relationships':
        return <RelationshipsView />;
      default:
        return <ComponentsView />;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {renderContent()}
    </Box>
  );
};

export default Inspector;
