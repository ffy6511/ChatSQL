import React, { useState, useEffect } from 'react';
import {
  Button,
  Tooltip,
  Empty,
  List,
  Spin,
  message,
  Tabs,
  Badge,
  Modal
} from 'antd';
import {
  EditOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useLLMContext } from '@/contexts/LLMContext';
import { useCompletionContext } from '@/contexts/CompletionContext';
import { useEditorContext } from '@/contexts/EditorContext';
import { useHistoryRecords } from '@/hooks/useHistoryRecords';
import HistoryItem from './HistoryItem';
import StatusFilter from './StatusFilter';
import styles from './HistoryPanel.module.css';
import SearchBar from './SearchBar';
import { ProgressStatus, filterRecordsByStatus, isTutorialRecord } from '@/utils/progressUtils';
import { clearAllProblems } from '@/services/codingStorage';

const HistoryPanel: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProgressStatus | 'ALL'>('ALL');
  const [isClearModalVisible, setIsClearModalVisible] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
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
      const { getProblemById } = await import('@/services/codingStorage');
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

  // 监听记录更新事件，自动刷新列表
  useEffect(() => {
    const handleRecordsUpdated = () => {
      refreshRecords();
    };

    window.addEventListener('recordsUpdated', handleRecordsUpdated);
    return () => {
      window.removeEventListener('recordsUpdated', handleRecordsUpdated);
    };
  }, [refreshRecords]);

  // 过滤记录的函数
  const filterRecords = (records: any[]) => {
    let filteredRecords = records;

    // 按搜索查询过滤
    if (searchQuery.trim()) {
      filteredRecords = filteredRecords.filter(record =>
        record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.data?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 按状态过滤（仅对教程记录）
    if (statusFilter !== 'ALL') {
      const tutorialRecords = filteredRecords.filter(isTutorialRecord);
      const nonTutorialRecords = filteredRecords.filter(record => !isTutorialRecord(record));
      const filteredTutorials = filterRecordsByStatus(tutorialRecords, statusFilter);
      filteredRecords = [...filteredTutorials, ...nonTutorialRecords];
    }

    return filteredRecords;
  };

  // 清除所有记录的功能
  const handleClearAllRecords = async () => {
    setIsClearing(true);
    try {
      await clearAllProblems();
      await refreshRecords(); // 刷新记录列表
      messageApi.success('所有记录已清除');
      setIsClearModalVisible(false);
    } catch (error) {
      console.error('清除记录失败:', error);
      messageApi.error('清除记录失败，请重试');
    } finally {
      setIsClearing(false);
    }
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
        {/* 搜索框 */}
        <div className={styles.searchContainer}>
          <SearchBar onSearch={setSearchQuery} />
        </div>

        {/* 一键清除记录 */}
        <Tooltip title="清除所有记录">
          <Button
            type="text"
            icon={<DeleteOutlined />}
            className={styles.actionButton}
            onClick={() => setIsClearModalVisible(true)}
            style={{ marginRight: '8px' }}
          />
        </Tooltip>

        {/* 新建记录 */}
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

      {/* 状态筛选器 - 仅在有教程记录时显示 */}
      {recentRecords.some(isTutorialRecord) && (
        <div style={{ padding: '0 16px', marginBottom: '12px',marginLeft:'4px' }}>
          <StatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            tutorialCount={recentRecords.filter(isTutorialRecord).length}
          />
        </div>
      )}
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

      {/* 清除所有记录确认对话框 */}
      <Modal
        title="确认清除所有记录"
        open={isClearModalVisible}
        onOk={handleClearAllRecords}
        onCancel={() => setIsClearModalVisible(false)}
        okText="确认清除"
        cancelText="取消"
        okType="danger"
        confirmLoading={isClearing}
      >
        <p>确定要清除所有记录吗？此操作不可撤销。</p>
        <p style={{ color: 'var(--secondary-text)', fontSize: '12px' }}>
          这将删除所有保存的问题记录，包括教程和自定义问题。
        </p>
      </Modal>
    </div>
  );
};

export default HistoryPanel;
