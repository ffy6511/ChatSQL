'use client';

import React from 'react';
import { Splitter } from 'antd';
import styles from './page.module.css';
import Sidebar from '@/components/ERDiagram/UI/Sidebar';
import Canvas from '@/components/ERDiagram/UI/Canvas';
import Inspector from '@/components/ERDiagram/UI/Inspector';
import { ERDiagramProvider, useERDiagramContext } from '@/contexts/ERDiagramContext';

const ERDiagramContent: React.FC = () => {
  const { state, setActiveTab } = useERDiagramContext();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentContainer}>
        <Splitter className={styles.mainSplitter}>
          {/* 左侧边栏 */}
          <Splitter.Panel
            resizable={false}
            defaultSize="250px"
            className={styles.sidebarPanel}
          >
            <Sidebar
              activeTab={state.activeSidebarTab}
              onTabChange={setActiveTab}
            />
          </Splitter.Panel>

          {/* 中间画布区域 */}
          <Splitter.Panel>
            <Splitter style={{ height: '100%', width: '100%' }}>
              <Splitter.Panel
                defaultSize="70%"
                min="50%"
                max="85%"
                className={styles.canvasPanel}
              >
                <Canvas hasData={!!state.diagramData} />
              </Splitter.Panel>

              {/* 右侧详情栏 */}
              <Splitter.Panel
                defaultSize="30%"
                min="15%"
                max="50%"
                className={styles.inspectorPanel}
              >
                <Inspector activeTab={state.activeSidebarTab} />
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>
        </Splitter>
      </div>
    </div>
  );
};

const ERDiagramPage: React.FC = () => {
  return (
    <ERDiagramProvider>
      <ERDiagramContent />
    </ERDiagramProvider>
  );
};

export default ERDiagramPage;
