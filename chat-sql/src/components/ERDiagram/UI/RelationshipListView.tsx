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
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import { ERRelationship, ERConnection, ERAttribute } from '@/types/erDiagram';
import styles from './Inspector.module.css';

const RelationshipListView: React.FC = () => {
  const { state, deleteRelationship, setSelectedElement, updateConnection } = useERDiagramContext();
  const relationships = state.diagramData?.relationships || [];
  const entities = state.diagramData?.entities || [];
  const [expandedRelationships, setExpandedRelationships] = useState<string[]>([]);
  const [editingConnection, setEditingConnection] = useState<string | null>(null);

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
  const isWeakRelationship = (relationship: ERRelationship) => {
    return relationship.connections.some((connection: ERConnection) => {
      const entity = entities.find(e => e.id === connection.entityId);
      return entity?.isWeakEntity === true;
    });
  };

  // 基数选项
  const cardinalityOptions = ['0..1', '1..1', '0..*', '1..*'];

  // 处理基数变更
  const handleCardinalityChange = (relationshipId: string, entityId: string, newCardinality: string) => {
    updateConnection(relationshipId, entityId, { cardinality: newCardinality as ERConnection['cardinality'] });
    setEditingConnection(null);
  };

  const renderConnectionItem = (connection: ERConnection, relationshipId: string) => {
    const isEditing = editingConnection === `${relationshipId}-${connection.entityId}`;

    return (
      <Box key={connection.entityId} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
        <Typography sx={{ flex: 1 }}>{getEntityName(connection.entityId)}</Typography>

        {isEditing ? (
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={connection.cardinality}
              onChange={(e) => handleCardinalityChange(relationshipId, connection.entityId, e.target.value)}
              autoFocus
            >
              {cardinalityOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Chip
            label={connection.cardinality}
            color="info"
            clickable
            onClick={() => setEditingConnection(`${relationshipId}-${connection.entityId}`)}
          />
        )}

        {connection.role && (
          <Typography variant="body2" color="text.secondary">({connection.role})</Typography>
        )}
      </Box>
    );
  };

  const renderAttributeItem = (attribute: ERAttribute) => (
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
                    {relationship.connections.map(connection => renderConnectionItem(connection, relationship.id))}
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

export default RelationshipListView;
