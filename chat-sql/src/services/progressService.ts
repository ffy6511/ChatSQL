import { LLMProblem, getProblemById, updateProblem } from './recordsIndexDB';
import { calculateProgressStatus } from '@/utils/progressUtils';

/**
 * 进度更新服务
 * 处理教程进度的更新和管理
 */
export class ProgressService {
  /**
   * 更新记录的进度
   * @param recordId 记录ID
   * @param completedProblemIndex 完成的问题索引（从0开始）
   * @returns 更新后的记录和状态信息
   */
  static async updateProgress(recordId: number, completedProblemIndex: number): Promise<{
    record: LLMProblem;
    statusInfo: any;
    isNewCompletion: boolean;
  }> {
    const record = await getProblemById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const currentProgress = record.progress ?? 0;
    const totalProblems = record.totalProblems ?? 1;
    
    // 计算新的进度（确保不超过总数）
    const newProgress = Math.min(completedProblemIndex + 1, totalProblems);
    const isNewCompletion = newProgress > currentProgress;

    if (isNewCompletion) {
      // 更新进度
      const updatedRecord: LLMProblem = {
        ...record,
        progress: newProgress
      };

      await updateProblem(updatedRecord);
      
      const statusInfo = calculateProgressStatus(updatedRecord);
      
      return {
        record: updatedRecord,
        statusInfo,
        isNewCompletion: true
      };
    }

    return {
      record,
      statusInfo: calculateProgressStatus(record),
      isNewCompletion: false
    };
  }

  /**
   * 重置记录的进度
   * @param recordId 记录ID
   * @returns 重置后的记录
   */
  static async resetProgress(recordId: number): Promise<LLMProblem> {
    const record = await getProblemById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const updatedRecord: LLMProblem = {
      ...record,
      progress: 0
    };

    await updateProblem(updatedRecord);
    return updatedRecord;
  }

  /**
   * 标记记录为完成
   * @param recordId 记录ID
   * @returns 更新后的记录
   */
  static async markAsCompleted(recordId: number): Promise<LLMProblem> {
    const record = await getProblemById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const totalProblems = record.totalProblems ?? 1;
    const updatedRecord: LLMProblem = {
      ...record,
      progress: totalProblems
    };

    await updateProblem(updatedRecord);
    return updatedRecord;
  }

  /**
   * 获取记录的进度信息
   * @param recordId 记录ID
   * @returns 进度信息
   */
  static async getProgressInfo(recordId: number): Promise<{
    record: LLMProblem;
    statusInfo: any;
    percentage: number;
  }> {
    const record = await getProblemById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const statusInfo = calculateProgressStatus(record);
    const progress = record.progress ?? 0;
    const totalProblems = record.totalProblems ?? 1;
    const percentage = totalProblems > 0 ? Math.round((progress / totalProblems) * 100) : 0;

    return {
      record,
      statusInfo,
      percentage
    };
  }
}
