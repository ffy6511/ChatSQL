

import { useState } from 'react';
import { saveLLMProblem, LLMProblem } from '@/services/recordsIndexDB';
import { message } from 'antd';

export const useSimpleStorage = () => {
  const [isSaving, setIsSaving] = useState(false);

  const storeProblem = async (data: any, recordProps: Partial<LLMProblem> = {}) => {
    setIsSaving(true);
    try {
      // 调试日志：输出传入的参数（生产环境可移除）
      console.log('storeProblem 调用参数:', {
        data,
        recordProps,
        recordPropsKeys: Object.keys(recordProps)
      });

      // 如果提供了额外的记录属性，使用它们创建完整记录
      if (Object.keys(recordProps).length > 0) {
        const record: LLMProblem = {
          data,
          createdAt: new Date(), // 确保提供必需的 createdAt 字段
          ...recordProps
        };

        // 调试日志：输出最终要保存的记录对象
        console.log('storeProblem 最终保存的记录:', record);

        const id = await saveLLMProblem(record);
        message.success('问题保存成功');
        return id;
      } else {
        // 保持原有行为
        console.log('storeProblem 使用原有行为保存:', data);
        const id = await saveLLMProblem(data);
        message.success('问题保存成功');
        return id;
      }
    } catch (error) {
      message.error('保存失败: ' + (error instanceof Error ? error.message : String(error)));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    storeProblem,
    isSaving
  };
};
