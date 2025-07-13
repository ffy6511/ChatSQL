'use client';

import React, { useState } from 'react';
import { Button, Tooltip, Modal } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  TableOutlined,
  ShareAltOutlined,
  QuestionCircleOutlined,
  GithubOutlined
} from '@ant-design/icons';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import styles from './Sidebar.module.css';

type ActiveTab = 'components' | 'entities' | 'relationships';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const { newDiagram, loadSampleData } = useERDiagramContext();

  const handleNewDiagram = () => {
    newDiagram();
    console.log('新建图表');
  };

  const handleOpenDiagram = () => {
    loadSampleData();
    console.log('加载示例数据');
  };

  const handleComponentsClick = () => {
    onTabChange('components');
  };

  const handleEntitiesClick = () => {
    onTabChange('entities');
  };

  const handleRelationshipsClick = () => {
    onTabChange('relationships');
  };

  const handleHelpClick = () => {
    setIsHelpModalOpen(true);
  };

  const handleGithubClick = () => {
    window.open('https://github.com/ffy6511/chatSQL', '_blank');
  };

  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.topButtons}>
        <Tooltip title="新建图表" placement="right">
          <Button 
            type="text"
            icon={<PlusOutlined />}
            className={styles.actionButton}
            onClick={handleNewDiagram}
          />
        </Tooltip>
        
        <Tooltip title="打开图表" placement="right">
          <Button 
            type="text"
            icon={<FolderOpenOutlined />}
            className={styles.actionButton}
            onClick={handleOpenDiagram}
          />
        </Tooltip>
      </div>

      <div className={styles.menuContainer}>
        <div className={styles.menuItems}>
          <Tooltip title="组件库" placement="right">
            <Button
              type="text"
              icon={<AppstoreOutlined />}
              className={`${styles.actionButton} ${activeTab === 'components' ? styles.activeButton : ''}`}
              onClick={handleComponentsClick}
            />
          </Tooltip>
        </div>

        <div className={styles.menuItems}>
          <Tooltip title="实体" placement="right">
            <Button
              type="text"
              icon={<TableOutlined />}
              className={`${styles.actionButton} ${activeTab === 'entities' ? styles.activeButton : ''}`}
              onClick={handleEntitiesClick}
            />
          </Tooltip>
        </div>

        <div className={styles.menuItems}>
          <Tooltip title="关系" placement="right">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              className={`${styles.actionButton} ${activeTab === 'relationships' ? styles.activeButton : ''}`}
              onClick={handleRelationshipsClick}
            />
          </Tooltip>
        </div>
      </div>
      
      <div className={styles.bottomButtons}>
        <Tooltip title="帮助" placement="right">
          <Button 
            type="text" 
            icon={<QuestionCircleOutlined />}
            className={styles.actionButton}
            onClick={handleHelpClick}
          />
        </Tooltip>
        
        <Tooltip title="GitHub仓库" placement="right">
          <Button 
            type="text" 
            icon={<GithubOutlined />}
            className={styles.actionButton}
            onClick={handleGithubClick}
          />
        </Tooltip>
      </div>

      <Modal
        title="ER图帮助"
        open={isHelpModalOpen}
        onCancel={() => setIsHelpModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className={styles.helpContent}>
          <h3>ER图可视化建模工具</h3>
          <p>这是一个交互式的ER图可视化建模工具，帮助您创建和编辑实体关系图。</p>
          
          <h4>主要功能：</h4>
          <ul>
            <li><strong>组件库</strong>：提供强实体集、弱实体集、关系等基本组件</li>
            <li><strong>实体管理</strong>：查看和编辑所有实体及其属性</li>
            <li><strong>关系管理</strong>：管理实体间的关系和约束</li>
            <li><strong>可视化画布</strong>：拖拽式操作，直观的图形界面</li>
          </ul>

          <h4>使用方法：</h4>
          <ol>
            <li>从组件库拖拽组件到画布</li>
            <li>双击节点进行重命名</li>
            <li>拖拽连接点创建关系</li>
            <li>在右侧面板编辑详细属性</li>
          </ol>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;
