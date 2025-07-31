import { LLMProblem } from '@/services/codingStorage';

/**
 * 进度状态枚举
 */
export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

/**
 * 进度状态显示信息
 */
export interface ProgressStatusInfo {
  status: ProgressStatus;
  label: string;
  color: 'default' | 'processing' | 'success' | 'error' | 'warning';
  description?: string;
}

/**
 * 计算记录的进度状态
 * @param record LLM问题记录
 * @returns 进度状态信息
 */
export function calculateProgressStatus(record: LLMProblem): ProgressStatusInfo {
  const progress = record.progress ?? 0;
  const totalProblems = record.totalProblems ?? 1;

  // 确保进度值在有效范围内
  const validProgress = Math.max(0, Math.min(progress, totalProblems));

  if (validProgress === 0) {
    return {
      status: ProgressStatus.NOT_STARTED,
      label: 'Not Started',
      color: 'default',
      description: '尚未开始'
    };
  } else if (validProgress < totalProblems) {
    return {
      status: ProgressStatus.IN_PROGRESS,
      label: `Progress: ${validProgress}/${totalProblems}`,
      color: 'processing',
      description: `已完成 ${validProgress} 个问题，共 ${totalProblems} 个`
    };
  } else {
    return {
      status: ProgressStatus.COMPLETED,
      label: 'Completed',
      color: 'success',
      description: '已完成所有问题'
    };
  }
}

/**
 * 获取进度百分比
 * @param record LLM问题记录
 * @returns 进度百分比 (0-100)
 */
export function getProgressPercentage(record: LLMProblem): number {
  const progress = record.progress ?? 0;
  const totalProblems = record.totalProblems ?? 1;
  
  if (totalProblems === 0) return 0;
  
  return Math.round((progress / totalProblems) * 100);
}

/**
 * 检查记录是否为教程
 * @param record LLM问题记录
 * @returns 是否为教程
 */
export function isTutorialRecord(record: LLMProblem): boolean {
  return record.isTutorial === true;
}

/**
 * 根据状态过滤记录
 * @param records 记录列表
 * @param status 要过滤的状态
 * @returns 过滤后的记录列表
 */
export function filterRecordsByStatus(
  records: LLMProblem[], 
  status: ProgressStatus | 'ALL'
): LLMProblem[] {
  if (status === 'ALL') {
    return records;
  }

  return records.filter(record => {
    const statusInfo = calculateProgressStatus(record);
    return statusInfo.status === status;
  });
}

/**
 * 获取状态统计信息
 * @param records 记录列表
 * @returns 各状态的数量统计
 */
export function getStatusStatistics(records: LLMProblem[]): {
  notStarted: number;
  inProgress: number;
  completed: number;
  total: number;
} {
  const stats = {
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    total: records.length
  };

  records.forEach(record => {
    const statusInfo = calculateProgressStatus(record);
    switch (statusInfo.status) {
      case ProgressStatus.NOT_STARTED:
        stats.notStarted++;
        break;
      case ProgressStatus.IN_PROGRESS:
        stats.inProgress++;
        break;
      case ProgressStatus.COMPLETED:
        stats.completed++;
        break;
    }
  });

  return stats;
}
