import { Node, Edge } from "@xyflow/react";
import {
  ERDiagramData,
  EREntity,
  ERRelationship,
} from "../types/ERDiagramTypes/erDiagram";
import { EntityNodeData } from "../components/ERDiagram/canvasRelated/EntityNode";
import { DiamondNodeData } from "../components/ERDiagram/canvasRelated/DiamondNode";

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
  startY: 100,
};

// 简单的自动布局算法
function calculateLayout(
  entities: EREntity[],
  relationships: ERRelationship[],
  config: LayoutConfig
) {
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

// 计算两点之间的距离
function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 确定最近的连接点
function determineNearestHandles(
  sourceNode: Node,
  targetNode: Node
): { sourceHandle: string; targetHandle: string } {
  // 获取节点的实际尺寸和连接点位置
  const sourceIsEntity = sourceNode.type === "entity";
  const targetIsEntity = targetNode.type === "entity";

  // 节点尺寸
  const sourceWidth = sourceIsEntity ? 260 : 160;
  const sourceHeight = sourceIsEntity ? 60 : 100;

  const targetWidth = targetIsEntity ? 260 : 160;
  const targetHeight = targetIsEntity ? 60 : 100;

  // 连接点偏移量（根据CSS样式设置）
  const sourceHandleOffset = sourceIsEntity ? 4 : 10;
  const targetHandleOffset = targetIsEntity ? 4 : 10;

  // 源节点的连接点位置
  const sourceHandles = [
    {
      id: "top",
      x: sourceNode.position.x + sourceWidth / 2,
      y: sourceNode.position.y + sourceHandleOffset,
    },
    {
      id: "right",
      x: sourceNode.position.x + sourceWidth - sourceHandleOffset,
      y: sourceNode.position.y + sourceHeight / 2,
    },
    {
      id: "bottom",
      x: sourceNode.position.x + sourceWidth / 2,
      y: sourceNode.position.y + sourceHeight - sourceHandleOffset,
    },
    {
      id: "left",
      x: sourceNode.position.x + sourceHandleOffset,
      y: sourceNode.position.y + sourceHeight / 2,
    },
  ];

  // 目标节点的连接点位置
  const targetHandles = [
    {
      id: "top",
      x: targetNode.position.x + targetWidth / 2,
      y: targetNode.position.y + targetHandleOffset,
    },
    {
      id: "right",
      x: targetNode.position.x + targetWidth - targetHandleOffset,
      y: targetNode.position.y + targetHeight / 2,
    },
    {
      id: "bottom",
      x: targetNode.position.x + targetWidth / 2,
      y: targetNode.position.y + targetHeight - targetHandleOffset,
    },
    {
      id: "left",
      x: targetNode.position.x + targetHandleOffset,
      y: targetNode.position.y + targetHeight / 2,
    },
  ];

  // 找到最近的连接点组合
  let minDistance = Infinity;
  let nearestSourceHandle = "right";
  let nearestTargetHandle = "left";

  for (const sourceHandle of sourceHandles) {
    for (const targetHandle of targetHandles) {
      const distance = calculateDistance(
        sourceHandle.x,
        sourceHandle.y,
        targetHandle.x,
        targetHandle.y
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestSourceHandle = sourceHandle.id;
        nearestTargetHandle = targetHandle.id;
      }
    }
  }

  // console.log("计算连接点:", {
  //   sourceNode: sourceNode.id,
  //   targetNode: targetNode.id,
  //   sourceHandle: nearestSourceHandle,
  //   targetHandle: nearestTargetHandle,
  //   sourcePosition: sourceNode.position,
  //   targetPosition: targetNode.position
  // });

  return {
    sourceHandle: nearestSourceHandle,
    targetHandle: nearestTargetHandle,
  };
}

// 主转换函数
export function convertERJsonToFlow(
  erData: ERDiagramData,
  layoutConfig: Partial<LayoutConfig> = {},
  forceLayout: boolean = false
): { nodes: Node[]; edges: Edge[] } {
  const config = { ...defaultLayoutConfig, ...layoutConfig };
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 检查是否需要计算布局
  const shouldCalculateLayout =
    forceLayout ||
    erData.entities.some((e) => !e.position) ||
    erData.relationships.some((r) => !r.position);

  const positions = shouldCalculateLayout
    ? calculateLayout(erData.entities, erData.relationships, config)
    : new Map<string, { x: number; y: number }>();

  // 1. 创建实体节点
  erData.entities.forEach((entity) => {
    const position =
      entity.position && !forceLayout
        ? entity.position
        : positions.get(entity.id) || { x: 0, y: 0 };

    const entityNode: Node<EntityNodeData> = {
      id: entity.id,
      type: "entity",
      position,
      data: {
        label: entity.name,
        description: entity.description,
        attributes: entity.attributes,
        isWeakEntity: entity.isWeakEntity,
      },
      draggable: true,
    };

    nodes.push(entityNode);
  });

  // 2. 创建关系节点
  erData.relationships.forEach((relationship) => {
    const position =
      relationship.position && !forceLayout
        ? relationship.position
        : positions.get(relationship.id) || { x: 0, y: 0 };

    // 判断关系是否连接了弱实体集
    const isWeakRelationship = relationship.connections.some((connection) => {
      const entity = erData.entities.find((e) => e.id === connection.entityId);
      return entity?.isWeakEntity === true;
    });

    const relationshipNode: Node<DiamondNodeData> = {
      id: relationship.id,
      type: "diamond",
      position,
      data: {
        label: relationship.name,
        description: relationship.description,
        attributes: relationship.attributes,
        isWeakRelationship,
      },
      draggable: true,
    };

    nodes.push(relationshipNode);
  });

  // 3. 创建边（连接实体和关系）
  erData.relationships.forEach((relationship) => {
    relationship.connections.forEach((connection, index) => {
      const edgeId = `edge-${connection.entityId}-${relationship.id}-${index}`;

      const entityNode = nodes.find((n) => n.id === connection.entityId);
      const relationshipNode = nodes.find((n) => n.id === relationship.id);

      if (!entityNode || !relationshipNode) {
        return; // Skip if nodes are not found
      }

      // 确定最近的连接点
      const { sourceHandle, targetHandle } = determineNearestHandles(
        entityNode,
        relationshipNode
      );

      // console.log("创建Edge:", {
      //   edgeId,
      //   source: connection.entityId,
      //   target: relationship.id,
      //   sourceHandle,
      //   targetHandle,
      // });

      const edge: Edge = {
        id: edgeId,
        source: connection.entityId,
        target: relationship.id,
        sourceHandle,
        targetHandle,
        label: connection.cardinality,
        type: "default",
        animated: false,
        style: {
          stroke: "#E8B05B",
          strokeWidth: 2,
        },
        labelStyle: {
          fill: "#1976d2",
          fontWeight: 600,
          fontSize: "12px",
        },
        labelBgStyle: {
          fill: "white",
          fillOpacity: 0.8,
          stroke: "#e0e0e0",
          strokeWidth: 1,
        },
        data: {
          role: connection.role,
          // 添加连接信息用于删除功能
          relationshipId: relationship.id,
          entityId: connection.entityId,
        },
      };
      edges.push(edge);
    });
  });

  return { nodes, edges };
}

// 优化布局的辅助函数
export function optimizeLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  // TODO: 根据距离动态调整连接的端口
  // 目前返回原始布局
  return { nodes, edges };
}

// 导出布局配置类型供外部使用
export type { LayoutConfig };
