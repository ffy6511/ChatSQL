/**
 * B+树操作历史的数据结构和类型定义
 * 支持版本控制与回溯功能
 */

import { Node, Edge } from '@xyflow/react';
import { BPlusNodeData } from '@/types/BplusTypes/bPlusTree';

/**
 * 历史步骤接口
 * 记录每个操作的详细信息和状态快照
 */
export interface HistoryStep {
  /** 步骤唯一标识符 */
  id: string;
  
  /** 操作类型 */
  operation: 'insert' | 'delete' | 'initial' | 'reset';
  
  /** 操作的键值（如果适用） */
  key?: number;
  
  /** 操作时间戳 */
  timestamp: number;
  
  /** React Flow 节点状态快照 */
  nodes: Node<BPlusNodeData>[];
  
  /** React Flow 边状态快照 */
  edges: Edge[];
  
  /** 当前树中的所有键值 */
  keys: number[];
  
  /** 操作描述（用于显示） */
  description: string;
  
  /** 操作执行前的状态（用于回溯） */
  previousState?: {
    nodes: Node<BPlusNodeData>[];
    edges: Edge[];
    keys: number[];
  };
  
  /** 操作是否成功 */
  success: boolean;
  
  /** 错误信息（如果操作失败） */
  error?: string;
  
  /** 操作耗时（毫秒） */
  duration?: number;
}

/**
 * 历史会话接口
 * 表示一个完整的B+树操作序列
 */
export interface HistorySession {
  /** 会话唯一标识符 */
  id: string;
  
  /** 会话名称 */
  name: string;
  
  /** B+树阶数 */
  order: number;
  
  /** 操作步骤列表 */
  steps: HistoryStep[];
  
  /** 当前激活的步骤索引 */
  currentStepIndex: number;
  
  /** 会话创建时间 */
  createdAt: number;
  
  /** 会话最后更新时间 */
  updatedAt: number;
  
  /** 会话描述 */
  description?: string;
  
  /** 会话标签 */
  tags?: string[];
  
  /** 会话是否已完成 */
  isCompleted: boolean;
  
  /** 会话统计信息 */
  statistics: {
    /** 总操作数 */
    totalOperations: number;
    /** 插入操作数 */
    insertCount: number;
    /** 删除操作数 */
    deleteCount: number;
    /** 重置操作数 */
    resetCount: number;
    /** 成功操作数 */
    successCount: number;
    /** 失败操作数 */
    errorCount: number;
    /** 总耗时 */
    totalDuration: number;
  };
}

/**
 * 历史管理器配置接口
 */
export interface HistoryManagerConfig {
  /** 最大保存的会话数量 */
  maxSessions: number;
  
  /** 每个会话最大保存的步骤数量 */
  maxStepsPerSession: number;
  
  /** 是否自动保存 */
  autoSave: boolean;
  
  /** 自动保存间隔（毫秒） */
  autoSaveInterval: number;
  
  /** 是否压缩历史数据 */
  compressData: boolean;
}

/**
 * 历史查询条件接口
 */
export interface HistoryQuery {
  /** 会话ID过滤 */
  sessionId?: string;
  
  /** 操作类型过滤 */
  operation?: HistoryStep['operation'];
  
  /** 时间范围过滤 */
  timeRange?: {
    start: number;
    end: number;
  };
  
  /** 键值过滤 */
  key?: number;
  
  /** 是否只查询成功的操作 */
  successOnly?: boolean;
  
  /** 排序方式 */
  sortBy?: 'timestamp' | 'operation' | 'key';
  
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  
  /** 分页参数 */
  pagination?: {
    offset: number;
    limit: number;
  };
}

/**
 * 历史导出格式接口
 */
export interface HistoryExport {
  /** 导出格式版本 */
  version: string;
  
  /** 导出时间 */
  exportedAt: number;
  
  /** 导出的会话数据 */
  sessions: HistorySession[];
  
  /** 导出配置 */
  config: HistoryManagerConfig;
  
  /** 元数据 */
  metadata: {
    totalSessions: number;
    totalSteps: number;
    exportSize: number;
  };
}

/**
 * 历史导入结果接口
 */
export interface HistoryImportResult {
  /** 导入是否成功 */
  success: boolean;
  
  /** 导入的会话数量 */
  importedSessions: number;
  
  /** 导入的步骤数量 */
  importedSteps: number;
  
  /** 跳过的会话数量（已存在） */
  skippedSessions: number;
  
  /** 错误信息 */
  errors: string[];
  
  /** 警告信息 */
  warnings: string[];
}

/**
 * 历史统计信息接口
 */
export interface HistoryStatistics {
  /** 总会话数 */
  totalSessions: number;
  
  /** 总步骤数 */
  totalSteps: number;
  
  /** 最常用的操作类型 */
  mostUsedOperation: HistoryStep['operation'];
  
  /** 平均每个会话的步骤数 */
  averageStepsPerSession: number;
  
  /** 最长的会话（按步骤数） */
  longestSession: {
    id: string;
    name: string;
    stepCount: number;
  };
  
  /** 最近的活动时间 */
  lastActivityTime: number;
  
  /** 操作类型分布 */
  operationDistribution: {
    insert: number;
    delete: number;
    reset: number;
    initial: number;
  };
  
  /** 成功率 */
  successRate: number;
  
  /** 存储使用情况 */
  storageUsage: {
    totalSize: number;
    sessionSize: number;
    stepSize: number;
  };
}

/**
 * 历史事件接口
 * 用于历史管理器的事件通知
 */
export interface HistoryEvent {
  /** 事件类型 */
  type: 'session_created' | 'session_updated' | 'session_deleted' | 
        'step_added' | 'step_updated' | 'step_deleted' | 
        'current_step_changed' | 'history_cleared';
  
  /** 事件时间戳 */
  timestamp: number;
  
  /** 相关的会话ID */
  sessionId?: string;
  
  /** 相关的步骤ID */
  stepId?: string;
  
  /** 事件数据 */
  data?: any;
}

/**
 * 历史管理器事件监听器类型
 */
export type HistoryEventListener = (event: HistoryEvent) => void;

/**
 * 历史回溯选项接口
 */
export interface HistoryRevertOptions {
  /** 是否保留当前状态作为新步骤 */
  saveCurrentState?: boolean;
  
  /** 回溯后是否自动播放到目标步骤 */
  autoPlay?: boolean;
  
  /** 播放速度（毫秒） */
  playSpeed?: number;
  
  /** 是否显示回溯动画 */
  showAnimation?: boolean;
}

/**
 * 历史比较结果接口
 */
export interface HistoryComparison {
  /** 比较的步骤ID */
  stepIds: [string, string];
  
  /** 节点差异 */
  nodeDifferences: {
    added: Node<BPlusNodeData>[];
    removed: Node<BPlusNodeData>[];
    modified: Array<{
      before: Node<BPlusNodeData>;
      after: Node<BPlusNodeData>;
    }>;
  };
  
  /** 边差异 */
  edgeDifferences: {
    added: Edge[];
    removed: Edge[];
    modified: Array<{
      before: Edge;
      after: Edge;
    }>;
  };
  
  /** 键值差异 */
  keyDifferences: {
    added: number[];
    removed: number[];
  };
  
  /** 操作摘要 */
  summary: string;
}
