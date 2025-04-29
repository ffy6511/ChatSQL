'use client';

import React, { useState } from 'react';
import { Splitter } from 'antd';
import './App.css';
import SQLEditor from '@/components/codeEditing/SQLEditor';
import Container from '@/components/LLMInteractive/renderedArea/Container';
import LLMWindow from '@/components/LLMInteractive/LLMWindow/LLMWindow';
import { useLLMContext } from '@/contexts/LLMContext';
import HistoryPanel from '@/components/History/HistoryPanel';
import SideBar from '@/components/SideBar';
import { useQueryContext } from '@/contexts/QueryContext';
import { useEditorContext } from '@/contexts/EditorContext';
import QueryResultTable from '@/components/codeEditing/QueryResultTable';
import EmptyQueryState from '@/components/codeEditing/EmptyQueryState';

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
  const { showLLMWindow } = useLLMContext();
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  const handleToggleHistory = () => {
    setIsHistoryCollapsed(!isHistoryCollapsed);
  };

  const { sqlEditorValue, setSqlEditorValue } = useEditorContext(); // 使用EditorContext

  // 添加查询结果处理函数
  const handleQueryResult = (data: any) => {
    console.log('Query result:', data);
    // 这里可以添加更多的结果处理逻辑
  };

  return (
    <>
      <div className="app-container"> {/* 添加上边距以避免被导航栏遮挡 */}
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
            <Splitter style={{ height: '100%', width: '100%' }}>
            {/* 使用条件渲染来控制历史面板的显示/隐藏 */}
            {!isHistoryCollapsed && (
              <Splitter.Panel
                  min="15%"
                  // collapsible={true}
                defaultSize="20%"
                max="30%"
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
                  // 当显示LLM窗口时，占据整个区域
                  <div className="full-height-llm-container">
                    <LLMWindow />
                  </div>
                ) : (
                  // 正常模式：1上2下
                  <Splitter layout="vertical" style={{ height: '100%' }}>
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
                      <Splitter style={{ height: '100%' }}>
                        {/* 下部左侧区域 */}
                        <Splitter.Panel
                          defaultSize="50%"
                          min="30%"
                          className="lower-left-panel"
                        >
                          <SQLQueryArea />
                        </Splitter.Panel>

                        {/* 下部右侧区域 */}
                        <Splitter.Panel className="lower-right-panel">
                          <div className="lower-right-content">
                            <SQLEditor
                              onExecute={handleQueryResult}
                            />
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
    </>
  );
};

export default Page;
