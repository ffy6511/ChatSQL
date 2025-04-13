import React from 'react';
import { Splitter } from 'antd';
import './App.css';
import SQLEditor from '@/components/codeEditing/SQLEditor';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Splitter style={{ height: '100vh', width: '100vw', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
        {/* 左侧侧边栏 */}
        <Splitter.Panel
          collapsible
          size="200px" // 固定宽度为 200px
          className="sidebar-panel"
        >
          <div className="sidebar-content">
            <div className="sidebar-header">
              <span>侧边栏</span>
            </div>
            <div className="sidebar-body">
              <p>侧边栏内容</p>
              {/* 这里可以添加更多侧边栏内容 */}
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
                <h3>历史记录区域</h3>
                <p>历史记录内容...</p>
                {/* 这里可以添加历史记录的具体内容 */}
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
                    <h3>题目选择区域 / 题目的返回区域 (参考信息管理要求)</h3>
                    <p>上部区域内容...</p>
                    {/* 这里可以添加上部区域的具体内容 */}
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
                        <h3>SQL语句的输入区域域 - 左侧</h3>
                        <p>下部左侧区域内容...</p>
                        {/* 这里可以添加下部左侧的具体内容 */}
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

export default App;