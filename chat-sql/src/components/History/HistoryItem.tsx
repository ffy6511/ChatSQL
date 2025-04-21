'use client'

import React, { useState } from 'react';
import {
  List,
  Typography,
  Space,
  Button,
  Input,
  Tooltip,
  Modal,
  Badge
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  StarOutlined,
  StarFilled,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { LLMProblem } from '@/services/recordsIndexDB';
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
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  const handleRenameSubmit = () => {
    if (newTitle.trim()) {
      onRename(record.id!, newTitle.trim());
      setIsEditing(false);
    }
  };

  const handleRenameCancel = () => {
    setNewTitle(record.title || '');
    setIsEditing(false);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <List.Item
      className={`${styles.historyItem} ${isActive ? styles.active : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(record.id!)}
    >
      <div className={styles.itemContent}>
        {/* 删除确认对话框 */}
        <Modal
          title="删除确认"
          open={isDeleteConfirmVisible}
          onOk={() => {
            onDelete(record.id!);
            setIsDeleteConfirmVisible(false);
          }}
          onCancel={() => setIsDeleteConfirmVisible(false)}
          okText="确定删除"
          cancelText="取消"
          centered
          maskClosable={true} // 允许点击遮罩层关闭 
          className={styles.deleteModal}
        >
          <p>确定要删除这条记录吗？</p>
          <p>删除后将无法恢复。</p>
        </Modal>

        {isEditing ? (
          <div className={styles.editContainer}>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onPressEnter={handleRenameSubmit}
              autoFocus
              size="small"
            />
            <Space>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleRenameSubmit}
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={handleRenameCancel}
              />
            </Space>
          </div>
        ) : (
          <>
            <div className={styles.titleContainer}>
              <div className={styles.titleRow}>
              {/* <FileTextOutlined className={styles.titleIcon} /> */}
              <Text
                ellipsis={{ tooltip: record.title }}
                strong={isActive}
                className={styles.title}
              >
                {record.title}
              </Text>
              {record.isFavorite && (
                <Badge status="warning" className={styles.favoriteBadge} />
              )}
            </div>
            <div className={styles.dateRow}>
              <Text type="secondary" className={styles.date}>
                {formatDate(record.createdAt)}
              </Text>
            </div>
            </div>

            {isHovered && (
              <div className={styles.actions}>
                <Tooltip title="重命名" mouseEnterDelay={0.2} mouseLeaveDelay={0.2}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  />
                </Tooltip>
                <Tooltip title={record.isFavorite ? "取消收藏" : "收藏"} mouseEnterDelay={0.2} mouseLeaveDelay={0.2}>
                  <Button
                    type="text"
                    size="small"
                    icon={record.isFavorite ? <StarFilled /> : <StarOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(record.id!);
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除" mouseEnterDelay={0.2} mouseLeaveDelay={0.2}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteConfirmVisible(true);
                    }}
                  />
                </Tooltip>
              </div>
            )}
          </>
        )}
      </div>
    </List.Item>
  );
};

export default HistoryItem;
