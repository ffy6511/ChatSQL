

import { useState } from 'react';
import { saveLLMProblem, LLMProblem } from '@/services/recordsIndexDB';
import { message } from 'antd';

export const useSimpleStorage = () => {
  const [isSaving, setIsSaving] = useState(false);

  const storeProblem = async (data: any, recordProps: Partial<LLMProblem> = {}) => {
    setIsSaving(true);
    try {
      // 如果提供了额外的记录属性，使用它们创建完整记录
      if (Object.keys(recordProps).length > 0) {
        const record: LLMProblem = {
          data,
          createdAt: new Date(), // 确保提供必需的 createdAt 字段
          ...recordProps
        };
        const id = await saveLLMProblem(record);
        message.success('问题保存成功');
        return id;
      } else {
        // 保持原有行为
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
