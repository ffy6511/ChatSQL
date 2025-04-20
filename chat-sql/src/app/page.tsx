'use client';

import React from 'react';
import { Splitter } from 'antd';
import './App.css';
import SQLEditor from '@/components/codeEditing/SQLEditor';
import Container from '@/components/LLMInteractive/renderedArea/Container';
import LLMWindow from '@/components/LLMInteractive/LLMWindow/LLMWindow';
import { useLLMContext } from '@/contexts/LLMContext';
import HistoryPanel from '@/components/History/HistoryPanel';

const Page: React.FC = () => {
  const { showLLMWindow } = useLLMContext();

  return (
    <div className="app-container">
      <Splitter style={{ height: '100vh', width: '100vw', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'}} >
        {/* 左侧侧边栏 */}
        <Splitter.Panel
          collapsible
          defaultSize="200px"
          className="sidebar-panel"
          // onResize={() => {}}
        >
          <div className="sidebar-content">
            <div className="sidebar-header">
              <span>导航</span>
            </div>
            <div className="sidebar-body">
              {/* 侧边栏内容将在实现功能时添加 */}
            </div>
          </div>
        </Splitter.Panel>

        {/* 右侧区域：历史记录 + 大区域（ */}
        <Splitter.Panel>
          <Splitter style={{ height: '100%', width: '100%' }}>
            {/* 历史记录区域 */}
            <Splitter.Panel
              collapsible
              min="15%"
              defaultSize="20%"
              max="30%"
              className="history-panel"
            >
              <div className="history-content">
                <HistoryPanel />
              </div>
            </Splitter.Panel>

            {/* 右侧大区域：1上2下 */}
            <Splitter.Panel>
              <Splitter layout="vertical" style={{ height: '100%' }}>
                {/* 上部区域 */}
                <Splitter.Panel
                  defaultSize="50%"
                  min="30%"
                  max="70%"
                  className="upper-panel"
                >
                  <div className="upper-content">
                    {showLLMWindow ? (
                      <LLMWindow />
                    ) : (
                      <Container />
                    )}
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
                      <div className="lower-left-content">
                        <h3>SQL查询区域</h3>
                        {/* SQL查询相关内容将在实现功能时添加 */}
                      </div>
                    </Splitter.Panel>

                    {/* 下部右侧区域 */}
                    <Splitter.Panel className="lower-right-panel">
                      <div className="lower-right-content">
                        <SQLEditor />

                      </div>
                    </Splitter.Panel>
                  </Splitter>
                </Splitter.Panel>
              </Splitter>
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default Page;
