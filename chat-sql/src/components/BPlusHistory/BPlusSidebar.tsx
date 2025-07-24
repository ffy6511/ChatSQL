/**
 * B+树页面侧边栏组件
 * 参考ER图页面和主页面的侧边栏实现
 */

'use client';

import React, { useState } from 'react';
import { Button, Tooltip, Modal } from 'antd';
import ThemeToggle from '@/components/SideBar/ThemeToggle';
import {
  QuestionCircleOutlined,
  GithubOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';
import styles from './BPlusSidebar.module.css';

interface BPlusSidebarProps {
  /** 是否显示历史记录区域 */
  showHistory: boolean;
  /** 历史记录区域显示状态变更回调 */
  onToggleHistory: () => void;
  /** 新建记录回调 */
  onNewRecord: () => void;
}

const BPlusSidebar: React.FC<BPlusSidebarProps> = ({
  showHistory,
  onToggleHistory,
  onNewRecord
}) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleHelpClick = () => {
    setIsHelpModalOpen(true);
  };

  const handleGithubClick = () => {
    window.open('https://github.com/ffy6511/chatSQL', '_blank');
  };

  return (
    <div className="global-sidebar-container">
      {/* 顶部区域：新建记录和历史记录切换 */}
      <div className="global-sidebar-top-buttons">
        <Tooltip title="新建记录" placement="right">
          <Button
            type="text"
            icon={<PlusCircleOutlined />}
            className="global-sidebar-action-button"
            onClick={onNewRecord}
          />
        </Tooltip>

        <Tooltip title={showHistory ? "收起历史记录" : "展开历史记录"} placement="right">
          <Button
            type="text"
            icon={showHistory ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            className="global-sidebar-action-button"
            onClick={onToggleHistory}
          />
        </Tooltip>
      </div>

      {/* 中间区域：可扩展的功能按钮 */}
      <div className="global-sidebar-menu-container">
        <div className="global-sidebar-menu-items"><ThemeToggle /></div>
      </div>

      {/* 底部区域：帮助和GitHub链接 */}
      <div className="global-sidebar-bottom-buttons">
        <Tooltip title="帮助" placement="right">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            className="global-sidebar-action-button"
            onClick={handleHelpClick}
          />
        </Tooltip>

        <Tooltip title="GitHub仓库" placement="right">
          <Button
            type="text"
            icon={<GithubOutlined />}
            className="global-sidebar-action-button"
            onClick={handleGithubClick}
          />
        </Tooltip>
      </div>

      {/* 帮助模态框 */}
      <Modal
        title="B+树可视化帮助"
        open={isHelpModalOpen}
        onCancel={() => setIsHelpModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className={styles.helpModalContent}>
          <h3>B+树可视化学习工具</h3>
          <p>这是一个交互式的B+树可视化学习工具，帮助您理解B+树的数据结构和操作原理。</p>
        </div>
      </Modal>
    </div>
  );
};

export default BPlusSidebar;
