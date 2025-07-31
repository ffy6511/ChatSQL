import { LLMProblem, getProblemById, updateProblem } from './codingStorage';
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

    const totalProblems = record.totalProblems ?? 1;
    const completedProblems = record.completedProblems ?? new Array(totalProblems).fill(false);

    // 检查该问题是否已经完成
    const isAlreadyCompleted = completedProblems[completedProblemIndex] === true;

    if (!isAlreadyCompleted) {
      // 标记该问题为已完成
      const newCompletedProblems = [...completedProblems];
      newCompletedProblems[completedProblemIndex] = true;

      // 计算新的进度（已完成问题的数量）
      const newProgress = newCompletedProblems.filter(Boolean).length;

      // 更新记录
      const updatedRecord: LLMProblem = {
        ...record,
        progress: newProgress,
        completedProblems: newCompletedProblems
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

    const totalProblems = record.totalProblems ?? 1;
    const updatedRecord: LLMProblem = {
      ...record,
      progress: 0,
      completedProblems: new Array(totalProblems).fill(false)
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
      progress: totalProblems,
      completedProblems: new Array(totalProblems).fill(true)
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
    completedProblems: boolean[];
  }> {
    const record = await getProblemById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const statusInfo = calculateProgressStatus(record);
    const progress = record.progress ?? 0;
    const totalProblems = record.totalProblems ?? 1;
    const percentage = totalProblems > 0 ? Math.round((progress / totalProblems) * 100) : 0;
    const completedProblems = record.completedProblems ?? new Array(totalProblems).fill(false);

    return {
      record,
      statusInfo,
      percentage,
      completedProblems
    };
  }

  /**
   * 获取记录的问题完成状态
   * @param recordId 记录ID
   * @returns 问题完成状态数组
   */
  static async getCompletedProblems(recordId: number): Promise<boolean[]> {
    const record = await getProblemById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const totalProblems = record.totalProblems ?? 1;
    return record.completedProblems ?? new Array(totalProblems).fill(false);
  }

  /**
   * 清除记录的所有进度
   * @param recordId 记录ID
   * @returns 清除后的记录
   */
  static async clearAllProgress(recordId: number): Promise<LLMProblem> {
    const record = await getProblemById(recordId);
    if (!record) {
      throw new Error('记录不存在');
    }

    const totalProblems = record.totalProblems ?? 1;
    const updatedRecord: LLMProblem = {
      ...record,
      progress: 0,
      completedProblems: new Array(totalProblems).fill(false)
    };

    await updateProblem(updatedRecord);
    return updatedRecord;
  }
}
