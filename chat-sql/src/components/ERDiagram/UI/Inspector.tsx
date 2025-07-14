'use client';

import React, { useState } from 'react';
import { Card, Empty, Divider, Typography, Button, Tag, Space } from 'antd';
import {
  AppstoreOutlined,
  TableOutlined,
  ShareAltOutlined,
  BorderOutlined,
  GoldOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  DownOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import PropertyEditor from './PropertyEditor';
import { EREntity, ERRelationship } from '@/types/erDiagram';
import styles from './Inspector.module.css';

const { Text } = Typography;

type ActiveTab = 'components' | 'entities' | 'relationships';

interface InspectorProps {
  activeTab: ActiveTab;
}

const ComponentsView: React.FC = () => {
  const handleDragStart = (event: React.DragEvent, componentType: string) => {
    event.dataTransfer.setData('application/reactflow', componentType);
    event.dataTransfer.effectAllowed = 'move';

    // 添加拖拽时的视觉反馈
    const target = event.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (event: React.DragEvent) => {
    // 恢复拖拽元素的透明度
    const target = event.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const components = [
    {
      id: 'strong-entity',
      name: '强实体集',
      icon: <BorderOutlined className={styles.componentIcon} />,
      type: 'entity',
      description: '标准的实线矩形实体'
    },
    {
      id: 'weak-entity',
      name: '弱实体集',
      icon: <BorderOutlined className={styles.componentIcon} />,
      type: 'entity',
      description: '双实线矩形实体'
    },
    {
      id: 'relationship',
      name: '关系',
      icon: <GoldOutlined className={styles.componentIcon} />,
      type: 'diamond',
      description: '菱形关系节点'
    }
  ];

  return (
    <div className={styles.componentsView}>
      <h3 className={styles.viewTitle}>
        <AppstoreOutlined /> 组件库
      </h3>
      <Divider />

      <div className={styles.componentGrid}>
        {components.map((component) => (
          <Card
            key={component.id}
            className={styles.componentCard}
            hoverable
            size="small"
            draggable
            onDragStart={(e) => handleDragStart(e, component.type)}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.componentItem}>
              {component.icon}
              <div className={styles.componentInfo}>
                <Text strong>{component.name}</Text>
                <Text type="secondary" className={styles.componentDescription}>
                  {component.description}
                </Text>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.instructionText}>
        <p>拖拽组件到画布上开始创建ER图</p>
        <p>双击画布上的节点可以编辑名称</p>
      </div>
    </div>
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
        <Space>
          {attribute.isPrimaryKey && (
            <KeyOutlined className={styles.primaryKeyIcon} />
          )}
          <Text strong>{attribute.name}</Text>
          {attribute.isPrimaryKey && (
            <Tag color="red">
              {entities.find(e => e.id === entityId)?.isWeakEntity ? 'DIS' : 'PK'}
            </Tag>
          )}
          {attribute.isRequired && (
            <Tag color="orange">必填</Tag>
          )}
        </Space>
        <Text type="secondary" className={styles.attributeType}>
          {attribute.dataType}
        </Text>
      </div>
    </div>
  );

  return (
    <div className={styles.entitiesView}>
      <h3 className={styles.viewTitle}>
        <TableOutlined /> 实体列表
      </h3>
      <Divider />

      {entities.length === 0 ? (
        <Empty
          description="暂无实体"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className={styles.entityList}>
          {entities.map((entity) => (
            <Card
              key={entity.id}
              className={`${styles.entityCard} ${state.selectedElementId === entity.id ? styles.selected : ''}`}
              size="small"
            >
              <div
                className={styles.entityHeader}
                onClick={() => handleExpand(entity.id)}
              >
                <div className={styles.entityInfo}>
                  <Space>
                    {expandedEntities.includes(entity.id) ?
                      <DownOutlined className={styles.expandIcon} /> :
                      <RightOutlined className={styles.expandIcon} />
                    }
                    <Text strong>{entity.name}</Text>
                    {entity.isWeakEntity && (
                      <Tag color="purple">弱实体</Tag>
                    )}
                  </Space>
                  <Text type="secondary" className={styles.entityDescription}>
                    {entity.attributes.length} 个属性
                  </Text>
                </div>
                <div className={styles.entityActions}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement(entity.id);
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEntity(entity.id);
                    }}
                  />
                </div>
              </div>

              {expandedEntities.includes(entity.id) && (
                <div className={styles.entityContent}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div className={styles.attributesList}>
                    <Text type="secondary" className={styles.sectionTitle}>属性列表：</Text>
                    {entity.attributes.length === 0 ? (
                      <Text type="secondary" className={styles.emptyText}>暂无属性</Text>
                    ) : (
                      entity.attributes.map(attr => renderAttributeItem(attr, entity.id))
                    )}
                  </div>
                  {entity.description && (
                    <div className={styles.entityDescriptionFull}>
                      <Text type="secondary" className={styles.sectionTitle}>描述：</Text>
                      <Text>{entity.description}</Text>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className={styles.instructionText}>
        <p>从组件库添加实体后，将在此处显示</p>
        <p>点击实体可展开查看和编辑属性</p>
      </div>
    </div>
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
    <div key={connection.entityId} className={styles.connectionItem}>
      <Space>
        <Text>{getEntityName(connection.entityId)}</Text>
        <Tag color="blue">{connection.cardinality}</Tag>
        {connection.role && (
          <Text type="secondary">({connection.role})</Text>
        )}
      </Space>
    </div>
  );

  const renderAttributeItem = (attribute: any) => (
    <div key={attribute.id} className={styles.attributeItem}>
      <div className={styles.attributeInfo}>
        <Space>
          <Text strong>{attribute.name}</Text>
          {attribute.isPrimaryKey && (
            <Tag color="red">PK</Tag>
          )}
          {attribute.isRequired && (
            <Tag color="orange">必填</Tag>
          )}
        </Space>
        <Text type="secondary" className={styles.attributeType}>
          {attribute.dataType}
        </Text>
      </div>
    </div>
  );

  return (
    <div className={styles.relationshipsView}>
      <h3 className={styles.viewTitle}>
        <ShareAltOutlined /> 关系列表
      </h3>
      <Divider />

      {relationships.length === 0 ? (
        <Empty
          description="暂无关系"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className={styles.relationshipList}>
          {relationships.map((relationship) => (
            <Card
              key={relationship.id}
              className={`${styles.relationshipCard} ${state.selectedElementId === relationship.id ? styles.selected : ''}`}
              size="small"
            >
              <div
                className={styles.relationshipHeader}
                onClick={() => handleExpand(relationship.id)}
              >
                <div className={styles.relationshipInfo}>
                  <Space>
                    {expandedRelationships.includes(relationship.id) ?
                      <DownOutlined className={styles.expandIcon} /> :
                      <RightOutlined className={styles.expandIcon} />
                    }
                    <Text strong>{relationship.name}</Text>
                    {isWeakRelationship(relationship) && (
                      <Tag color="purple">弱关系</Tag>
                    )}
                  </Space>
                  <Text type="secondary" className={styles.relationshipDescription}>
                    {relationship.connections.length} 个连接
                  </Text>
                </div>
                <div className={styles.relationshipActions}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement(relationship.id);
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRelationship(relationship.id);
                    }}
                  />
                </div>
              </div>

              {expandedRelationships.includes(relationship.id) && (
                <div className={styles.relationshipContent}>
                  <Divider style={{ margin: '8px 0' }} />

                  <div className={styles.connectionsList}>
                    <Text type="secondary" className={styles.sectionTitle}>连接实体：</Text>
                    {relationship.connections.map(renderConnectionItem)}
                  </div>

                  {relationship.attributes && relationship.attributes.length > 0 && (
                    <div className={styles.attributesList}>
                      <Text type="secondary" className={styles.sectionTitle}>关系属性：</Text>
                      {relationship.attributes.map(renderAttributeItem)}
                    </div>
                  )}

                  {relationship.description && (
                    <div className={styles.relationshipDescriptionFull}>
                      <Text type="secondary" className={styles.sectionTitle}>描述：</Text>
                      <Text>{relationship.description}</Text>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className={styles.instructionText}>
        <p>连接实体和关系后，将在此处显示</p>
        <p>可以编辑基数约束和参与约束</p>
      </div>
    </div>
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
      <div className={styles.inspectorContainer}>
        <PropertyEditor
          selectedElement={selectedElement}
          onUpdateEntity={updateEntity}
          onUpdateRelationship={updateRelationship}
        />
      </div>
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
    <div className={styles.inspectorContainer}>
      {renderContent()}
    </div>
  );
};

export default Inspector;
