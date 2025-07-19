'use client'

import React, { useState } from 'react';
import {
  List,
  Typography,
  Button,
  Input,
  Tooltip,
  Modal,
  Tag,
  Dropdown,
  Space,
  MenuProps
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  StarOutlined,
  StarFilled,
  MoreOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { LLMProblem } from '@/services/recordsIndexDB';
import { calculateProgressStatus, isTutorialRecord } from '@/utils/progressUtils';
import styles from './HistoryItem.module.css';

const { Text } = Typography;

interface HistoryItemProps {
  record: LLMProblem;
  isActive: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onRename: (id: number, newTitle: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  record,
  isActive,
  onSelect,
  onDelete,
  onToggleFavorite,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(record.title || '');
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  // 标题处理函数
  const truncateTitle = (title: string, maxLength: number = 17) => {
    if (!title) return '';
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  const handleRenameSubmit = () => {
    if (newTitle.trim()) {
      // 限制保存时的标题长度
      const truncatedTitle = truncateTitle(newTitle.trim(), 50); // 存储时允许更长的标题
      onRename(record.id!, truncatedTitle);
      setIsEditing(false);
    }
  };

  const handleRenameCancel = () => {
    setNewTitle(record.title || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    setIsDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    onDelete(record.id!);
    setIsDeleteConfirmVisible(false);
  };

  const items: MenuProps['items'] = [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
      onClick: () => {
        setIsEditing(true);
      }
    },
    {
      key: 'favorite',
      icon: record.isFavorite ? <StarFilled /> : <StarOutlined />,
      label: record.isFavorite ? '取消收藏' : '收藏',
      onClick: () => {
        onToggleFavorite(record.id!);
      }
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => {
        handleDelete();
      }
    }
  ];

  // 格式化时间的函数
  const formatDate = (dateInput: Date | string) => {
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      
      if (isNaN(date.getTime())) {
        return '未知时间';
      }

      const year = date.getFullYear().toString().slice(2); // 只取年份后两位
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '未知时间';
    }
  };

  return (
    <div className={`${styles.globalStylesContainer}`}>
      <List.Item
        className={`${styles.historyItem} ${isActive ? styles.active : ''} ${record.isTutorial ? styles.tutorial : ''}`}
        onClick={() => onSelect(record.id!)}
      >
        {isEditing ? (
          <div className={styles.editingContainer} onClick={e => e.stopPropagation()}>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onPressEnter={handleRenameSubmit}
              maxLength={50} // 添加输入长度限制
              showCount // 显示字数统计
              autoFocus
            />
            <Space>
              <Button size="small" type="primary" onClick={handleRenameSubmit}>
                确定
              </Button>
              <Button size="small" onClick={handleRenameCancel}>
                取消
              </Button>
            </Space>
          </div>
        ) : (
          <>
            <div className={styles.titleContainer}>
             {/* 移除悬浮的标题显示 */}
                <Text ellipsis className={styles.title}>
                  {truncateTitle(record.title!)} {/* 显示截断的标题 */}
                </Text>
              <div className={styles.infoContainer}>
                <div className={styles.dateInfo}>
                  {/* <ClockCircleOutlined /> */}
                  <span>
                    {record.createdAt ? formatDate(record.createdAt) : '未知时间'}
                  </span>
                </div>
                <div className={styles.tagsContainer}>
                  {isTutorialRecord(record) ? (
                    // 教程记录显示进度状态
                    (() => {
                      const statusInfo = calculateProgressStatus(record);
                      const getTagColor = () => {
                        switch (statusInfo.status) {
                          case 'NOT_STARTED':
                            return 'default';
                          case 'IN_PROGRESS':
                            return 'processing';
                          case 'COMPLETED':
                            return 'success';
                          default:
                            return 'default';
                        }
                      };

                      return (
                        <Tag
                          color={getTagColor()}
                          className={styles.tag}
                          style={{
                            color: statusInfo.status === 'NOT_STARTED' ? 'var(--secondary-text)' : undefined,
                            borderColor: statusInfo.status === 'NOT_STARTED' ? 'var(--secondary-text)' : undefined
                          }}
                        >
                          {statusInfo.label}
                        </Tag>
                      );
                    })()
                  ) : (
                    // 非教程记录显示传统标签
                    <>
                      {record.data?.isBuiltIn && (
                        <Tag color="blue" className={styles.tag}>#{record.data.order}</Tag>
                      )}
                      {record.data?.category && (
                        <Tag color="cyan" className={styles.tag}>{record.data.category}</Tag>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.actionButton} onClick={e => e.stopPropagation()}>
              <Dropdown
                menu={{ items }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  className={styles.moreButton}
                />
              </Dropdown>
            </div>
          </>
        )}

        <Modal
          title="确认删除"
          open={isDeleteConfirmVisible}
          onOk={confirmDelete}
          onCancel={() => setIsDeleteConfirmVisible(false)}
          okText="确认"
          cancelText="取消"
        >
          <p>确定要删除这条记录吗？</p>
        </Modal>
      </List.Item>
    </div>
  );
};

export default HistoryItem;
