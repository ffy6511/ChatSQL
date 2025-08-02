/**
 * B+树历史记录项组件
 */

"use client";

import React, { useState } from "react";
import { Button, Dropdown, Space, Input, MenuProps } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CaretRightOutlined,
  PlusOutlined,
  MinusOutlined,
  ReloadOutlined,
  DotChartOutlined,
} from "@ant-design/icons";
import { HistorySession, HistoryStep } from "@/types/BplusTypes/bPlusHistory";
import styles from "./BPlusHistoryItem.module.css";

interface BPlusHistorySessionItemProps {
  session: HistorySession;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
  onRename: (sessionId: string, newName: string) => void;
  onDelete: (sessionId: string) => void;
}

interface BPlusHistoryStepItemProps {
  step: HistoryStep;
  stepIndex: number;
  isActive: boolean;
  isCurrent: boolean;
  onSelect: (stepIndex: number) => void;
}

// 格式化时间显示
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 获取操作图标和样式
const getOperationIcon = (operation: string) => {
  switch (operation) {
    case "insert":
      return <PlusOutlined />;
    case "delete":
      return <MinusOutlined />;
    case "reset":
      return <ReloadOutlined />;
    case "initial":
      return <DotChartOutlined />;
    default:
      return <DotChartOutlined />;
  }
};

// 会话项组件
export const BPlusHistorySessionItem: React.FC<
  BPlusHistorySessionItemProps
> = ({ session, isActive, onSelect, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== session.name) {
      onRename(session.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(session.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // 下拉菜单项
  const menuItems: MenuProps["items"] = [
    {
      key: "rename",
      icon: <EditOutlined />,
      label: "重命名",
      onClick: () => setIsEditing(true),
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除",
      danger: true,
      onClick: () => onDelete(session.id),
    },
  ];

  return (
    <div className={`${styles.globalStylesContainer}`}>
      <div
        className={`${styles.historyItem} ${isActive ? styles.active : ""}`}
        onClick={() => !isEditing && onSelect(session.id)}
      >
        {isEditing ? (
          <div
            className={styles.editingContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onPressEnter={handleRename}
              maxLength={50}
              showCount
              autoFocus
            />
            <Space>
              <Button size="small" type="primary" onClick={handleRename}>
                确定
              </Button>
              <Button size="small" onClick={handleCancelEdit}>
                取消
              </Button>
            </Space>
          </div>
        ) : (
          <>
            <div className={styles.titleContainer}>
              <div className={styles.title}>{session.name}</div>
              <div className={styles.infoContainer}>
                <div className={styles.dateInfo}>
                  <span>{formatTime(session.updatedAt)}</span>
                </div>
                <div className={styles.tagsContainer}>
                  <span className={styles.sessionTag}>
                    {session.steps.length} 步骤 • 阶数 {session.order}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={styles.actionButton}
              onClick={(e) => e.stopPropagation()}
            >
              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
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
      </div>
    </div>
  );
};

// 步骤项组件
export const BPlusHistoryStepItem: React.FC<BPlusHistoryStepItemProps> = ({
  step,
  stepIndex,
  isActive,
  isCurrent,
  onSelect,
}) => {
  return (
    <div className={`${styles.globalStylesContainer}`}>
      <div
        className={`${styles.historyItem} ${isActive ? styles.active : ""}`}
        onClick={() => onSelect(stepIndex)}
      >
        <div className={styles.stepItem}>
          <div className={`${styles.stepIcon} ${styles[step.operation]}`}>
            {getOperationIcon(step.operation)}
          </div>

          <div className={styles.stepContent}>
            <div className={styles.stepDescription}>{step.description}</div>
            <div className={styles.stepTime}>{formatTime(step.timestamp)}</div>
          </div>

          {isCurrent && (
            <div className={styles.currentStepIndicator}>
              <CaretRightOutlined />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
