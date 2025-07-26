/**
 * B+树相关的类型定义
 */

// React Flow节点数据接口
export interface BPlusNodeData extends Record<string, unknown> {
  keys: (number | string | null)[];
  pointers: (string | null)[];
  isLeaf: boolean;
  level: number;
  order: number;
  next?: string | null;
  highlighted?: boolean; // 添加高亮状态
  isOverflowing?: boolean; // 添加溢出状态字段
  keyHighlights?: boolean[]; // 添加键高亮状态数组
}
