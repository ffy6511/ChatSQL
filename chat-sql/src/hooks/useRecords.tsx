

import { useState } from 'react';
import { saveLLMProblem } from '@/services/recordsIndexDB';
import { message } from 'antd';

export const useSimpleStorage = () => {
  const [isSaving, setIsSaving] = useState(false);

  const storeProblem = async (data: any) => {
    setIsSaving(true);
    try {
      const id = await saveLLMProblem(data);
      message.success('问题保存成功');
      return id;
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
