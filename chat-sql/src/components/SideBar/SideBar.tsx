'use client'

import React, { useState } from 'react';
import { Button, Tooltip, Modal } from 'antd';
import { QuestionCircleOutlined, GithubOutlined } from '@ant-design/icons';
import { Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import styles from './SideBar.module.css';
import ThemeToggle from './ThemeToggle';
import GuidingModal from './GuidingModal';

const SideBar: React.FC = () => {
  const [isGuidingModalOpen, setIsGuidingModalOpen] = useState(false);

  const handleOpenGuide = () => {
    setIsGuidingModalOpen(true);
  };

  const handleCloseGuide = () => {
    setIsGuidingModalOpen(false);
  };

  const handleGithubClick = () => {
    window.open('https://github.com/ffy6511/chatSQL', '_blank');
  };

  return (
    <div className={styles.sideBarContainer}>

      {/* TODO: logo的设计与布局 */}

      {/* <div className={styles.logoContainer}>
        <h2 className={styles.logo}>ChatSQL</h2>
      </div> */}
      
      <div className={styles.menuContainer}>

        {/* TODO: 主题CSS变量的设置 */}
        {/* <Tooltip title="切换主题">
        <div className={styles.themeToggle}>
            <ThemeToggle />
        </div>
        </Tooltip> */}
        
        <div className={styles.menuItems}>
          {/* 导航菜单项 */}
        </div>
      </div>
      
      <div className={styles.actionButtons}>
        <Tooltip title="使用指南">
          <Button 
            type="text" 
            icon={<QuestionCircleOutlined />} 
            className={styles.actionButton}
            onClick={handleOpenGuide}
          />
        </Tooltip>
        

        
        <Tooltip title="GitHub 仓库">
          <Button 
            type="text" 
            icon={<GithubOutlined />} 
            className={styles.actionButton}
            onClick={handleGithubClick}
          />
        </Tooltip>
      </div>
      
      <GuidingModal 
        isOpen={isGuidingModalOpen} 
        onClose={handleCloseGuide} 
      />
    </div>
  );
};

export default SideBar;
