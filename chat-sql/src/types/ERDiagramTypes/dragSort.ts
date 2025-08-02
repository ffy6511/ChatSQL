// 拖拽排序相关类型定义

import { ERAttribute } from "./erDiagram";

// 拖拽项目接口
export interface DragItem {
  id: string;
  type: "attribute";
  data: ERAttribute;
}

// 拖拽结果接口
export interface DragResult {
  active: {
    id: string;
    data: {
      current: DragItem;
    };
  };
  over: {
    id: string;
  } | null;
}

// 属性排序状态接口
export interface AttributeOrderState {
  entityId: string;
  attributeIds: string[];
  lastUpdated: string;
}

// 拖拽上下文状态接口
export interface DragContextState {
  isDragging: boolean;
  activeId: string | null;
  draggedItem: DragItem | null;
}

// 排序操作结果接口
export interface SortResult {
  success: boolean;
  oldIndex: number;
  newIndex: number;
  entityId: string;
  attributeIds: string[];
  error?: string;
}

// 持久化存储接口
export interface AttributeOrderStorage {
  save: (entityId: string, attributeIds: string[]) => Promise<void>;
  load: (entityId: string) => Promise<string[] | null>;
  clear: (entityId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

// 拖拽配置接口
export interface DragConfig {
  animationDuration: number;
  dragOverlay: boolean;
  autoScroll: boolean;
  accessibility: {
    announcements: {
      onDragStart: (id: string) => string;
      onDragOver: (id: string, overId: string) => string;
      onDragEnd: (id: string, overId: string) => string;
      onDragCancel: (id: string) => string;
    };
  };
}

// 默认拖拽配置
export const defaultDragConfig: DragConfig = {
  animationDuration: 200,
  dragOverlay: true,
  autoScroll: true,
  accessibility: {
    announcements: {
      onDragStart: (id: string) => `开始拖拽属性 ${id}`,
      onDragOver: (id: string, overId: string) =>
        `将属性 ${id} 移动到 ${overId} 位置`,
      onDragEnd: (id: string, overId: string) =>
        `属性 ${id} 已移动到 ${overId} 位置`,
      onDragCancel: (id: string) => `取消拖拽属性 ${id}`,
    },
  },
};

// 拖拽事件处理器类型
export type DragStartHandler = (event: { active: { id: string } }) => void;
export type DragOverHandler = (event: {
  active: { id: string };
  over: { id: string } | null;
}) => void;
export type DragEndHandler = (event: {
  active: { id: string };
  over: { id: string } | null;
}) => void;
export type DragCancelHandler = () => void;
