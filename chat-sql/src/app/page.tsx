"use client";

import React, { useState, useEffect } from "react";
import { Splitter, message } from "antd";
import { useSearchParams } from "next/navigation";
import "./App.css";
import SQLEditor from "@/components/codeEditing/SQLEditor";
import Container from "@/components/LLMInteractive/renderedArea/Container";
import LLMWindow from "@/components/LLMInteractive/LLMWindow/LLMWindow";
import { useLLMContext } from "@/contexts/LLMContext";
import HistoryPanel from "@/components/codingHistory/HistoryPanel";
import SideBar from "@/components/SideBar";
import { useQueryContext } from "@/contexts/QueryContext";
import { useEditorContext } from "@/contexts/EditorContext";
import QueryResultTable from "@/components/codeEditing/QueryResultTable";
import EmptyQueryState from "@/components/codeEditing/EmptyQueryState";
import { useSelection } from "@/contexts/SelectionContext";

const SQLQueryArea: React.FC = () => {
  const { queryResult } = useQueryContext();

  return (
    <div className="lower-left-content">
      {queryResult ? (
        <QueryResultTable data={queryResult} />
      ) : (
        <EmptyQueryState />
      )}
    </div>
  );
};

const Page: React.FC = () => {
  const searchParams = useSearchParams();
  const { showLLMWindow, setCurrentProblemId } = useLLMContext();
  const { selectionState, setSelectedCodingId } = useSelection();
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  const handleToggleHistory = () => {
    setIsHistoryCollapsed(!isHistoryCollapsed);
  };

  const { sqlEditorValue, setSqlEditorValue } = useEditorContext(); // 使用EditorContext

  // 处理 URL 参数自动加载编码记录
  useEffect(() => {
    const urlRecordId = searchParams.get("recordId");

    if (urlRecordId) {
      const recordId = parseInt(urlRecordId, 10);
      if (!isNaN(recordId)) {
        // URL 中有记录 ID 参数，加载对应的记录
        loadCodingRecord(recordId);

        // 同步更新选择状态
        if (selectionState.selectedCodingId !== recordId) {
          setSelectedCodingId(recordId);
        }
      }
    } else if (selectionState.selectedCodingId) {
      // URL 中没有 ID，但选择状态中有，加载选择的记录
      loadCodingRecord(selectionState.selectedCodingId);
    }
  }, [
    searchParams,
    selectionState.selectedCodingId,
    setSelectedCodingId,
    setCurrentProblemId,
  ]);

  // 加载编码记录的辅助函数
  const loadCodingRecord = async (recordId: number) => {
    try {
      const { getProblemById } = await import("@/services/codingStorage");
      const record = await getProblemById(recordId);

      if (record) {
        // 设置当前问题ID到LLM上下文
        setCurrentProblemId(recordId);
        console.log("已加载编码记录:", record);
      } else {
        console.error("未找到指定的编码记录:", recordId);
        message.error("未找到指定的编码记录");
        // 清除无效的选择状态
        setSelectedCodingId(null);
      }
    } catch (error) {
      console.error("加载编码记录失败:", error);
      message.error("加载编码记录失败");
      // 清除无效的选择状态
      setSelectedCodingId(null);
    }
  };

  // 添加查询结果处理函数
  const handleQueryResult = (data: any) => {
    console.log("Query result:", data);
    // 这里可以添加更多的结果处理逻辑
  };

  return (
    <div className="content-container">
      <div className="app-container">
        <Splitter className="main-splitter">
          {/* 左侧侧边栏 */}
          <Splitter.Panel
            resizable={false}
            defaultSize="100px"
            className="sidebar-panel"
            // max = "10%"
          >
            <SideBar onToggleHistory={handleToggleHistory} />
          </Splitter.Panel>

          {/* 右侧区域：历史记录 + 大区域 */}
          <Splitter.Panel>
            <Splitter style={{ height: "100%", width: "100%" }}>
              {/* 使用条件渲染来控制历史面板的显示/隐藏 */}
              {!isHistoryCollapsed && (
                <Splitter.Panel
                  min="15%"
                  // collapsible={true}
                  defaultSize="19%"
                  max="21%"
                  className="history-panel"
                >
                  <div className="history-content">
                    <HistoryPanel />
                  </div>
                </Splitter.Panel>
              )}

              {/* 右侧大区域 */}
              <Splitter.Panel>
                {showLLMWindow ? (
                  // 当显示LLM窗口时，占据整个区域并垂直居中
                  <div
                    className="full-height-llm-container"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <LLMWindow />
                  </div>
                ) : (
                  // 正常模式：1上2下
                  <Splitter layout="vertical" style={{ height: "100%" }}>
                    {/* 上部区域 - 容器 */}
                    <Splitter.Panel
                      defaultSize="50%"
                      min="30%"
                      max="70%"
                      className="upper-panel"
                    >
                      <div className="upper-content">
                        <Container />
                      </div>
                    </Splitter.Panel>

                    {/* 下部区域：水平分为两部分 */}
                    <Splitter.Panel>
                      <Splitter style={{ height: "100%" }}>
                        {/* 下部左侧区域 */}
                        <Splitter.Panel
                          defaultSize="50%"
                          min="30%"
                          className="lower-left-panel"
                        >
                          <SQLQueryArea />
                        </Splitter.Panel>

                        {/* 下部右侧区域 */}
                        <Splitter.Panel>
                          <div style={{ height: "100%" }}>
                            <SQLEditor onExecute={handleQueryResult} />
                          </div>
                        </Splitter.Panel>
                      </Splitter>
                    </Splitter.Panel>
                  </Splitter>
                )}
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>
        </Splitter>
      </div>
    </div>
  );
};

export default Page;
