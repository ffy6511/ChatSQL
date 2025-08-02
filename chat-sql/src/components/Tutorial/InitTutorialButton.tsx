import React, { useState } from "react";
import { Button, Tooltip, message } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { tutorials } from "./tutorialData";
import { useSimpleStorage } from "@/hooks/useRecords";
import { useLLMContext } from "@/contexts/LLMContext";
import { LLMProblem } from "@/services/codingStorage";

const InitTutorialButton: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isProcessing, setIsProcessing] = useState(false);
  const { storeProblem } = useSimpleStorage();
  const { setCurrentProblemId, setLLMResult } = useLLMContext();

  const handleInitTutorials = async () => {
    const { getAllProblems } = await import("@/services/codingStorage");

    try {
      setIsProcessing(true);
      const existingProblems = await getAllProblems();

      const existingTutorials = new Set(
        existingProblems
          .filter((p) => p.data?.isBuiltIn)
          .map((p) => p.data?.order),
      );

      const missingTutorials = tutorials.filter(
        (t) => !existingTutorials.has(t.data.order),
      );

      if (missingTutorials.length === 0) {
        messageApi.info("教程已经完整初始化");
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
          category: tutorial.data.category,
        };

        // 正确分离核心数据和元数据
        // 核心数据：包含问题内容的数据
        const coreData = formattedTutorial;

        // 元数据：记录的属性信息（不包含data字段，避免重复嵌套）
        const recordMetadata: Partial<LLMProblem> = {
          title: tutorial.title,
          isTutorial: true, // 设置教程标志
          createdAt: new Date(),
          progress: 0, // 初始进度为0
          totalProblems: tutorial.problem.length, // 设置总问题数量
          completedProblems: new Array(tutorial.problem.length).fill(false), // 初始化所有问题为未完成
          // 注意：这里不包含 data 字段，因为 data 会由 storeProblem 函数设置
        };

        // 调试日志：输出传入 storeProblem 的参数（可在生产环境中移除）
        console.log("教程初始化 - storeProblem 调用参数:", {
          tutorial: tutorial.title,
          coreData,
          recordMetadata,
        });

        lastSavedId = await storeProblem(coreData, recordMetadata);
      }

      // 使用最后保存的教程 ID 触发更新
      if (lastSavedId) {
        setCurrentProblemId(lastSavedId);
        setLLMResult(null); // 清除之前的结果

        // 验证保存结果
        const { getProblemById } = await import("@/services/codingStorage");
        const savedRecord = await getProblemById(lastSavedId);
        console.log("验证保存结果:", savedRecord);

        if (savedRecord) {
          console.log("✓ 验证成功:");
          console.log("  - ID:", savedRecord.id);
          console.log("  - Title:", savedRecord.title);
          console.log("  - isTutorial:", savedRecord.isTutorial);
          console.log(
            "  - Description:",
            savedRecord.data?.description?.substring(0, 50) + "...",
          );
          console.log("  - Problem count:", savedRecord.data?.problem?.length);
        }
      }

      messageApi.success(`已添加 ${missingTutorials.length} 个教程`);
    } catch (error) {
      messageApi.error("教程初始化失败");
      console.error("初始化教程失败:", error);
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
