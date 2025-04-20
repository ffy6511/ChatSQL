'use client'

import React, { useState } from 'react';
import { 
  List, 
  Typography, 
  Space, 
  Button, 
  Popconfirm, 
  Input, 
  Tooltip, 
  Modal
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
              <Text 
                ellipsis={{ tooltip: record.title }}
                strong={isActive}
                className={styles.title}
              >
                {record.title}
              </Text>
              <Text type="secondary" className={styles.date}>
                {formatDate(record.createdAt)}
              </Text>
            </div>
            
            {isHovered && (
              <div className={styles.actions}>
                <Tooltip title="重命名">
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
                <Tooltip title={record.isFavorite ? "取消收藏" : "收藏"}>
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
                <Popconfirm
                  title="确定要删除这条记录吗？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    onDelete(record.id!);
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <Tooltip title="删除">
                    <Button 
                      type="text" 
                      size="small" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            )}
          </>
        )}
      </div>
    </List.Item>
  );
};

export default HistoryItem;
