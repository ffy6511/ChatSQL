import { EREntity, ERRelationship, ERAttribute } from '@/types/ERDiagramTypes/erDiagram';

// 生成唯一ID的工具函数
export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

// 创建默认实体
export function createDefaultEntity(position: { x: number; y: number }): EREntity {
  const id = generateUniqueId('ent');
  
  return {
    id,
    name: '实体',
    description: '新创建的实体',
    position,
    attributes: [
      {
        id: generateUniqueId('attr'),
        name: 'id',
        isPrimaryKey: true,
        dataType: 'VARCHAR(20)',
        isRequired: true,
        description: '主键'
      }
    ]
  };
}

// 创建默认关系
export function createDefaultRelationship(position: { x: number; y: number }): ERRelationship {
  const id = generateUniqueId('rel');
  
  return {
    id,
    name: '新关系',
    description: '新创建的关系',
    position,
    connections: [], // 初始时没有连接
    attributes: []
  };
}

// 创建默认属性
export function createDefaultAttribute(): ERAttribute {
  return {
    id: generateUniqueId('attr'),
    name: '新属性',
    dataType: 'VARCHAR(50)',
    isRequired: false,
    description: '新创建的属性'
  };
}

// 创建默认弱实体
export function createDefaultWeakEntity(position: { x: number; y: number }): EREntity {
  const id = generateUniqueId('ent');
  return {
    id,
    name: '弱实体',
    description: '新创建的弱实体',
    position,
    isWeakEntity: true,
    attributes: [
      {
        id: generateUniqueId('attr'),
        name: 'id',
        isPrimaryKey: true,
        dataType: 'VARCHAR(20)',
        isRequired: true,
        description: '标识符'
      }
    ]
  };
}

// 计算拖放位置（简化版本）
export function calculateDropPosition(
  event: DragEvent,
  canvasRect: DOMRect,
  viewport?: { x: number; y: number; zoom: number }
): { x: number; y: number } {
  // 计算相对于画布的位置
  const x = event.clientX - canvasRect.left;
  const y = event.clientY - canvasRect.top;

  if (viewport) {
    // 考虑缩放和平移
    const adjustedX = (x - viewport.x) / viewport.zoom;
    const adjustedY = (y - viewport.y) / viewport.zoom;
    return { x: adjustedX, y: adjustedY };
  }

  // 简化版本，直接返回相对位置
  return { x, y };
}

// 验证拖拽数据
export function validateDragData(dataTransfer: DataTransfer): string | null {
  const nodeType = dataTransfer.getData('application/reactflow');
  if (['strong-entity', 'weak-entity', 'diamond'].includes(nodeType)) {
    return nodeType;
  }
  return null;
}
