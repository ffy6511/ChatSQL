'use client';

import React from 'react';
import { Card, Empty, Divider, List, Typography } from 'antd';
import {
  AppstoreOutlined,
  TableOutlined,
  ShareAltOutlined,
  BorderOutlined,
  GoldOutlined
} from '@ant-design/icons';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
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
  const { state } = useERDiagramContext();
  const entities = state.diagramData?.entities || [];

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
        <List
          dataSource={entities}
          renderItem={(entity) => (
            <List.Item className={styles.entityItem}>
              <div className={styles.entityInfo}>
                <Text strong>{entity.name}</Text>
                <Text type="secondary" className={styles.entityDescription}>
                  {entity.attributes.length} 个属性
                </Text>
              </div>
            </List.Item>
          )}
        />
      )}

      <div className={styles.instructionText}>
        <p>从组件库添加实体后，将在此处显示</p>
        <p>点击实体可展开查看和编辑属性</p>
      </div>
    </div>
  );
};

const RelationshipsView: React.FC = () => {
  const { state } = useERDiagramContext();
  const relationships = state.diagramData?.relationships || [];

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
        <List
          dataSource={relationships}
          renderItem={(relationship) => (
            <List.Item className={styles.relationshipItem}>
              <div className={styles.relationshipInfo}>
                <Text strong>{relationship.name}</Text>
                <Text type="secondary" className={styles.relationshipDescription}>
                  {relationship.connections.length} 个连接
                </Text>
              </div>
            </List.Item>
          )}
        />
      )}

      <div className={styles.instructionText}>
        <p>连接实体和关系后，将在此处显示</p>
        <p>可以编辑基数约束和参与约束</p>
      </div>
    </div>
  );
};

const Inspector: React.FC<InspectorProps> = ({ activeTab }) => {
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
