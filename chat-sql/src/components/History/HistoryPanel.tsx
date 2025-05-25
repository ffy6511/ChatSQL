import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Tooltip, 
  Empty, 
  List, 
  Spin, 
  message, 
  Tabs,
  Badge 
} from 'antd';
import { 
  EditOutlined, 
  ClockCircleOutlined,
  HeartOutlined 
} from '@ant-design/icons';
import { useLLMContext } from '@/contexts/LLMContext';
import { useCompletionContext } from '@/contexts/CompletionContext';
import { useEditorContext } from '@/contexts/EditorContext';
import { useHistoryRecords } from '@/hooks/useHistoryRecords';
import HistoryItem from './HistoryItem';
import styles from './HistoryPanel.module.css';
import SearchBar from './SearchBar';

const HistoryPanel: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    recentRecords,
    favoriteRecords,
    loading,
    handleDelete,
    handleToggleFavorite,
    handleRename,
    refreshRecords
  } = useHistoryRecords();

  const { 
    setLLMResult, 
    setCurrentProblemId, 
    setShowLLMWindow,
    showLLMWindow,
    currentProblemId 
  } = useLLMContext();

  const { resetCompletion } = useCompletionContext();  // 获取重置方法
  const { clearEditor } = useEditorContext();  // 引入 clearEditor

  // 当选择一个历史记录时
  const handleSelectRecord = async (id: number) => {
    try {
      // 从 IndexedDB 获取完整记录
      const { getProblemById } = await import('@/services/recordsIndexDB');
      const problem = await getProblemById(id);

      if (problem) {
        console.log('加载问题成功:', problem);

        // 更新上下文
        setCurrentProblemId(id);
        resetCompletion();  // 重置完成状态
        clearEditor();      // 清空编辑器内容

        // 构造 DifyResponse 格式的数据
        const difyResponse = {
          data: {
            outputs: problem.data
          }
        };

        console.log('设置 LLM 结果:', difyResponse);

        // 先设置为 null 然后再设置新值，强制触发组件重新渲染
        setLLMResult(null);
        setTimeout(() => {
          setLLMResult(difyResponse);
          setShowLLMWindow(false); // 关闭 LLM 窗口，显示内容
        }, 50);
      }
    } catch (error) {
      console.error('加载问题失败:', error);
    }
  };

  // 当组件挂载或 currentProblemId 变化时刷新列表
  useEffect(() => {
    refreshRecords();
  }, [refreshRecords, currentProblemId]);

  // 过滤记录的函数
  const filterRecords = (records: any[]) => {
    if (!searchQuery) return records;
    return records.filter(record => 
      record.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderList = (records: any[]) => {
    if (loading) {
      return <Spin className={styles.spinner} />;
    }

    if (records.length === 0 && !loading) {
      return <Empty 
        description="暂无记录" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className={styles.empty}
      />;
    }

    return (
      <List
        className={styles.list}
        dataSource={records}
        renderItem={(record) => (
          <HistoryItem
            key={record.id}
            record={record}
            isActive={record.id === currentProblemId}
            onSelect={handleSelectRecord}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onRename={handleRename}
          />
        )}
      />
    );
  };

  const handleNewChat = () => {
    // 检查是否已经在新建对话界面
    if (showLLMWindow && !currentProblemId) {
      messageApi.info('您已处于新建的对话当中');
      return;
    }
    
    setLLMResult(null);
    setCurrentProblemId(null);
    setShowLLMWindow(true);
  };

  return (
    <div className={styles.historyPanel}>
      {contextHolder}
      <div className={styles.headerContainer}>
        <div className={styles.searchContainer}>
          <SearchBar onSearch={setSearchQuery} />
        </div>
        <Tooltip title="新建对话">
          <Button
            type="primary"
            icon={<EditOutlined />}
            className={styles.actionButton}
            onClick={handleNewChat}
            style={{marginRight:'1em'}}
          />
        </Tooltip>
      </div>
      <div className={styles.tabsContainer}>
        <Tabs
          defaultActiveKey="recent"
          items={[
            {
              key: 'recent',
              label: (
                <span className={styles.tabLabel}>
                  <ClockCircleOutlined />
                  最近
                  <Badge
                    size="small"
                  />
                </span>
              ),
              children: renderList(filterRecords(recentRecords))
            },
            {
              key: 'favorite',
              label: (
                <span className={styles.tabLabel}>
                  <HeartOutlined />
                  收藏
                  <Badge
                    size="small"
                  />
                </span>
              ),
              children: renderList(filterRecords(favoriteRecords))
            },
          ]}
        />
      </div>
    </div>
  );
};

export default HistoryPanel;
