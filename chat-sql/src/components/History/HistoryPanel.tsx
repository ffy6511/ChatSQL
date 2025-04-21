'use client'

import React, { useEffect } from 'react';
import { Tabs, List, Empty, Spin, Typography, Badge, Button, Tooltip } from 'antd';
import { StarOutlined, ClockCircleOutlined, HistoryOutlined, HeartOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useHistoryRecords } from '@/hooks/useHistoryRecords';
import { useLLMContext } from '@/contexts/LLMContext';
import HistoryItem from './HistoryItem';
import styles from './HistoryPanel.module.css';

const { Title } = Typography;

const HistoryPanel: React.FC = () => {
  const {
    recentRecords,
    favoriteRecords,
    loading,
    handleDelete,
    handleToggleFavorite,
    handleRename,
    refreshRecords
  } = useHistoryRecords();

  const { currentProblemId, setCurrentProblemId, setLLMResult, setShowLLMWindow, showLLMWindow } = useLLMContext();

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

  const renderList = (records: any[]) => {
    if (loading) {
      return <Spin className={styles.spinner} />;
    }

    if (records.length === 0) {
      return <Empty description="暂无记录" className={styles.empty} />;
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

  return (
    <div className={styles.historyPanel}>
      <div className={styles.headerContainer}>
        <div className={styles.headerLeft}>
          {/* <HistoryOutlined className={styles.headerIcon} /> */}
          <div className={styles.title}>历史记录</div>
        </div>
        <Tooltip title="新建对话">
          <Button
            type="primary"
            // shape="circle"
            icon={<PlusCircleOutlined />}
            className={styles.newChatButton}
            onClick={() => {
              setLLMResult(null);
              setCurrentProblemId(null);
              setShowLLMWindow(true);
            }}
          />
        </Tooltip>
      </div>
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
                  count={recentRecords.length}
                  className={styles.countBadge}
                  size="small"
                  style={{ backgroundColor: '#52c41a' }}
                />
              </span>
            ),
            children: renderList(recentRecords),
          },
          {
            key: 'favorite',
            label: (
              <span className={styles.tabLabel}>
                <HeartOutlined />
                收藏
                <Badge
                  count={favoriteRecords.length}
                  className={styles.countBadge}
                  size="small"
                  style={{ backgroundColor: '#faad14' }}
                />
              </span>
            ),
            children: renderList(favoriteRecords),
          },
        ]}
      />
    </div>
  );
};

export default HistoryPanel;
