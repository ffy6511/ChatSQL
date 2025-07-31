import { Node, Edge } from '@xyflow/react';
import { ERDiagramData, EREntity, ERRelationship } from '../types/ERDiagramTypes/erDiagram';
import { EntityNodeData } from '../components/ERDiagram/canvasRelated/EntityNode';
import { DiamondNodeData } from '../components/ERDiagram/canvasRelated/DiamondNode';

// 布局配置
interface LayoutConfig {
  entitySpacing: number;
  relationshipSpacing: number;
  levelSpacing: number;
  startX: number;
  startY: number;
}

const defaultLayoutConfig: LayoutConfig = {
  entitySpacing: 300,
  relationshipSpacing: 200,
  levelSpacing: 400,
  startX: 100,
  startY: 100
};

// 简单的自动布局算法
function calculateLayout(entities: EREntity[], relationships: ERRelationship[], config: LayoutConfig) {
  const positions = new Map<string, { x: number; y: number }>();

  const leftColumnX = config.startX;
  const middleColumnX = config.startX + config.levelSpacing;
  const rightColumnX = config.startX + 2 * config.levelSpacing;

  // 放置实体到左右两列
  entities.forEach((entity, index) => {
    const isLeft = index % 2 === 0;
    const x = isLeft ? leftColumnX : rightColumnX;
    const y = config.startY + Math.floor(index / 2) * config.entitySpacing;
    positions.set(entity.id, { x, y });
  });

  // 放置所有关系到中间列
  relationships.forEach((relationship, index) => {
    const y = config.startY + index * config.relationshipSpacing + 50; // Y轴上错开
    positions.set(relationship.id, { x: middleColumnX, y });
  });

  return positions;
}

// 主转换函数
export function convertERJsonToFlow(
  erData: ERDiagramData, 
  layoutConfig: Partial<LayoutConfig> = {}
): { nodes: Node[], edges: Edge[] } {
  const config = { ...defaultLayoutConfig, ...layoutConfig };
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // 计算布局
  const positions = calculateLayout(erData.entities, erData.relationships, config);
  
  // 1. 创建实体节点
  erData.entities.forEach((entity) => {
    const position = positions.get(entity.id) || { x: 0, y: 0 };
    
    const entityNode: Node<EntityNodeData> = {
      id: entity.id,
      type: 'entity',
      position,
      data: {
        label: entity.name,
        description: entity.description,
        attributes: entity.attributes,
        isWeakEntity: entity.isWeakEntity,
      },
      draggable: true
    };
    
    nodes.push(entityNode);
  });
  
  // 2. 创建关系节点
  erData.relationships.forEach((relationship) => {
    const position = positions.get(relationship.id) || { x: 0, y: 0 };

    // 判断关系是否连接了弱实体集
    const isWeakRelationship = relationship.connections.some(connection => {
      const entity = erData.entities.find(e => e.id === connection.entityId);
      return entity?.isWeakEntity === true;
    });

    const relationshipNode: Node<DiamondNodeData> = {
      id: relationship.id,
      type: 'diamond',
      position,
      data: {
        label: relationship.name,
        description: relationship.description,
        attributes: relationship.attributes,
        isWeakRelationship
      },
      draggable: true
    };

    nodes.push(relationshipNode);
  });
  
  // 3. 创建边（连接实体和关系）
  erData.relationships.forEach((relationship) => {
    relationship.connections.forEach((connection, index) => {
      const edgeId = `edge-${connection.entityId}-${relationship.id}-${index}`;

      const entityNode = nodes.find(n => n.id === connection.entityId);
      const relationshipNode = nodes.find(n => n.id === relationship.id);

      if (!entityNode || !relationshipNode) {
        return; // Skip if nodes are not found
      }

      // With a 3-column layout, connections are always horizontal.
      // We just need to determine if the entity is on the left or right column.
      let sourceHandle: string;
      let targetHandle: string;

      if (entityNode.position.x < relationshipNode.position.x) {
        // Entity is on the left of the relationship
        sourceHandle = 'right';
        targetHandle = 'left';
      } else {
        // Entity is on the right of the relationship
        sourceHandle = 'left';
        targetHandle = 'right';
      }

      const isTotal = connection.cardinality.startsWith('1');

      const edge: Edge = {
        id: edgeId,
        source: connection.entityId,
        target: relationship.id,
        sourceHandle,
        targetHandle,
        label: connection.cardinality,
        type: 'default',
        animated: false,
        style: {
          stroke: '#E8B05B',
          strokeWidth: 2
        },
        labelStyle: {
          fill: '#1976d2',
          fontWeight: 600,
          fontSize: '12px'
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.8,
          stroke: '#e0e0e0',
          strokeWidth: 1
        },
        data: {
          role: connection.role
        }
      };
      edges.push(edge);
    });
  });
  
  return { nodes, edges };
}

// 确定源连接点
function determineSourceHandle(
  entityId: string, 
  relationshipId: string, 
  positions: Map<string, { x: number; y: number }>
): string {
  const entityPos = positions.get(entityId);
  const relationshipPos = positions.get(relationshipId);
  
  if (!entityPos || !relationshipPos) return 'right';
  
  const dx = relationshipPos.x - entityPos.x;
  const dy = relationshipPos.y - entityPos.y;
  
  // 根据相对位置确定连接点
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'bottom' : 'top';
  }
}

// 确定目标连接点
function determineTargetHandle(
  entityId: string, 
  relationshipId: string, 
  positions: Map<string, { x: number; y: number }>
): string {
  const entityPos = positions.get(entityId);
  const relationshipPos = positions.get(relationshipId);
  
  if (!entityPos || !relationshipPos) return 'left';
  
  const dx = entityPos.x - relationshipPos.x;
  const dy = entityPos.y - relationshipPos.y;
  
  // 根据相对位置确定连接点
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'bottom' : 'top';
  }
}

// 优化布局的辅助函数
export function optimizeLayout(nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } {
  // TODO: 根据距离动态调整连接的端口
  // 目前返回原始布局
  return { nodes, edges };
}

// 导出布局配置类型供外部使用
export type { LayoutConfig };
