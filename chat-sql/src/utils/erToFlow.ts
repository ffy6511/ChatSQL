import { Node, Edge } from '@xyflow/react';
import { ERDiagramData, EREntity, ERRelationship } from '../types/erDiagram';
import { EntityNodeData } from '../components/ERDiagram/EntityNode';
import { DiamondNodeData } from '../components/ERDiagram/DiamondNode';

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
  
  // 计算实体位置 - 左右两列布局
  entities.forEach((entity, index) => {
    const column = index % 2; // 0 = 左列, 1 = 右列
    const row = Math.floor(index / 2);
    
    positions.set(entity.id, {
      x: config.startX + column * config.levelSpacing,
      y: config.startY + row * config.entitySpacing
    });
  });
  
  // 计算关系位置 - 放在中间
  relationships.forEach((relationship, index) => {
    // 尝试将关系放在相关实体的中间
    const connectedEntities = relationship.connections.map(conn => conn.entityId);
    let avgX = config.startX + config.levelSpacing / 2; // 默认中间位置
    let avgY = config.startY + index * config.relationshipSpacing;
    
    if (connectedEntities.length > 0) {
      const entityPositions = connectedEntities
        .map(entityId => positions.get(entityId))
        .filter(pos => pos !== undefined);
      
      if (entityPositions.length > 0) {
        avgX = entityPositions.reduce((sum, pos) => sum + pos!.x, 0) / entityPositions.length;
        avgY = entityPositions.reduce((sum, pos) => sum + pos!.y, 0) / entityPositions.length;
        
        // 稍微偏移避免重叠
        avgX += (index % 2 === 0 ? 50 : -50);
        avgY += 150; // 向下偏移
      }
    }
    
    positions.set(relationship.id, { x: avgX, y: avgY });
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
        attributes: entity.attributes
      },
      draggable: true
    };
    
    nodes.push(entityNode);
  });
  
  // 2. 创建关系节点
  erData.relationships.forEach((relationship) => {
    const position = positions.get(relationship.id) || { x: 0, y: 0 };
    
    const relationshipNode: Node<DiamondNodeData> = {
      id: relationship.id,
      type: 'diamond',
      position,
      data: {
        label: relationship.name,
        description: relationship.description,
        attributes: relationship.attributes
      },
      draggable: true
    };
    
    nodes.push(relationshipNode);
  });
  
  // 3. 创建边（连接实体和关系）
  erData.relationships.forEach((relationship) => {
    // 统计每个实体已分配的handle数
    const entityHandleCount: Record<string, number> = {};
    relationship.connections.forEach((connection, index) => {
      const edgeId = `edge-${connection.entityId}-${relationship.id}-${index}`;
      // 强制顺序分配 handle
      const handleOrder = ['top', 'right', 'bottom', 'left'];
      const count = entityHandleCount[connection.entityId] || 0;
      const sourceHandle = handleOrder[count % 4];
      const targetHandle = handleOrder[count % 4];
      entityHandleCount[connection.entityId] = count + 1;
      // 根据参与约束确定边的类型
      const edgeType = connection.isTotalParticipation ? 'totalParticipationEdge' : 'smoothstep';
      const edge: Edge = {
        id: edgeId,
        source: connection.entityId,
        target: relationship.id,
        sourceHandle,
        targetHandle,
        label: connection.cardinality,
        type: edgeType,
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
          isTotalParticipation: connection.isTotalParticipation || false,
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
