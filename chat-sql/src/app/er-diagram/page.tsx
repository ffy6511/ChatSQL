'use client';

import React, {useState, useCallback} from 'react';
import { message, Splitter } from 'antd';
import styles from './page.module.css';
import Sidebar from '@/components/ERDiagram/UI/Sidebar';
import Canvas from '@/components/ERDiagram/UI/Canvas';
import { Snackbar, Alert } from '@mui/material';
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
            defaultSize="100px"
            className="sidebar-panel"
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // 用于显示通知的回调函数
  const handleShowNotification = useCallback((message:string, severity:'success' | 'info' | 'warning' | 'error' = 'info') => {
    setSnackbar({open:true, message, severity});
  }, []);

 // Snackbar关闭处理
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []); 

  return (
    <ERDiagramProvider showNotification={handleShowNotification}>
      <ERDiagramContent />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={handleSnackbarClose}
        sx = {{mt:4}}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            bgcolor: `var(--${snackbar.severity}-bg)`,
            color: 'var(--snackbar-text)',
            '& .MuiAlert-icon': {
              color: `var(--${snackbar.severity}-icon)`,
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ERDiagramProvider>
  );
};

export default ERDiagramPage;
