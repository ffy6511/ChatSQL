import React, { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { ReadOutlined } from '@ant-design/icons';
import { tutorials } from './tutorialData';
import { useSimpleStorage } from '@/hooks/useRecords';
import { useLLMContext } from '@/contexts/LLMContext';

const InitTutorialButton: React.FC<{ className?: string }> = ({ className }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isProcessing, setIsProcessing] = useState(false);
  const { storeProblem } = useSimpleStorage();
  const { setCurrentProblemId, setLLMResult } = useLLMContext();

  const handleInitTutorials = async () => {
    const { getAllProblems } = await import('@/services/recordsIndexDB');
    
    try {
      setIsProcessing(true);
      const existingProblems = await getAllProblems();
      
      const existingTutorials = new Set(
        existingProblems
          .filter(p => p.data?.isBuiltIn)
          .map(p => p.data?.order)
      );

      const missingTutorials = tutorials.filter(t => !existingTutorials.has(t.data.order));

      if (missingTutorials.length === 0) {
        messageApi.info('教程已经完整初始化');
        return;
      }

      // 保存最后一个教程的 ID，用于触发更新
      let lastSavedId = null;

      for (const tutorial of missingTutorials) {
        const formattedTutorial = {
          description: tutorial.description,
          problem: tutorial.problem,
          hint: tutorial.hint,
          tags: tutorial.tags,
          tableStructure: tutorial.tableStructure,
          tuples: tutorial.tuples,
          expected_result: tutorial.expected_result, // 添加预期结果
          isBuiltIn: true,
          order: tutorial.data.order,
          category: tutorial.data.category
        };
        
        lastSavedId = await storeProblem(formattedTutorial);
      }
      
      // 使用最后保存的教程 ID 触发更新
      if (lastSavedId) {
        setCurrentProblemId(lastSavedId);
        setLLMResult(null);  // 清除之前的结果
      }
      
      messageApi.success(`已添加 ${missingTutorials.length} 个教程`);
    } catch (error) {
      messageApi.error('教程初始化失败');
      console.error('初始化教程失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Tooltip title="初始化教程" placement="right">
        <Button
          type="text"
          icon={<ReadOutlined />}
          className={className}
          onClick={handleInitTutorials}
          loading={isProcessing}
        />
      </Tooltip>
    </>
  );
};

export default InitTutorialButton;
