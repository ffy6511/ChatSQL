'use client';

import React, {useState, useCallback, useEffect} from 'react';
import { message, Splitter } from 'antd';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import Sidebar from '@/components/ERDiagram/UI/Sidebar';
import Canvas from '@/components/ERDiagram/UI/Canvas';
import { Snackbar, Alert } from '@mui/material';
import Inspector from '@/components/ERDiagram/UI/Inspector';
import { ERDiagramProvider, useERDiagramContext } from '@/contexts/ERDiagramContext';
import { useSelection } from '@/contexts/SelectionContext';

const ERDiagramContent: React.FC = () => {
  const searchParams = useSearchParams();
  const { selectionState, setSelectedERId } = useSelection();
  const { state, setActiveTab, loadDiagram } = useERDiagramContext();

  // 处理 URL 参数自动加载
  useEffect(() => {
    const urlId = searchParams.get('id');

    if (urlId) {
      // URL 中有 ID 参数，加载对应的图表
      console.log('从URL参数加载ER图:', urlId);
      loadDiagram(urlId).catch(error => {
        console.error('从URL参数加载ER图失败:', error);
        message.error('加载指定的ER图失败');
      });

      // 同步更新选择状态
      if (selectionState.selectedERId !== urlId) {
        setSelectedERId(urlId);
      }
    } else if (selectionState.selectedERId) {
      // URL 中没有 ID，但选择状态中有，加载选择的图表
      loadDiagram(selectionState.selectedERId).catch(error => {
        console.error('从选择状态加载ER图失败:', error);
        // 如果加载失败，清除选择状态
        setSelectedERId(null);
      });
    }
  }, [searchParams, selectionState.selectedERId, loadDiagram, setSelectedERId]);

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
