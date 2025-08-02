/**
 * B+树模块统一导出
 * 提供完整的B+树算法、动画管理和可视化功能
 */

// 核心算法和数据结构
export { BPlusTreeCore } from "./core";
export { BPlusTreeAlgorithm } from "./algorithm";

// 指令系统
export { AlgorithmBase, createBPlusNode, BTREE_CONSTANTS } from "./commands";

export type { BPlusCommand, BPlusNode, EdgeStyle } from "./commands";

// 动画管理
export { AnimationManager } from "./animationManager";

export type { AnimationState, AnimationCallbacks } from "./animationManager";

// 指令执行器
export { CommandExecutor } from "./commandExecutor";

export type { CommandExecutorCallbacks } from "./commandExecutor";

// 持久化存储
export { BPlusTreeStorage, getBPlusTreeStorage } from "./storage";

export type { BPlusTreeStorageData } from "./storage";

// 类型定义
export type { BPlusCommand as Command } from "./commands";
export type { AnimationState as State } from "./animationManager";
