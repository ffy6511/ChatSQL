'use client'

import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined, GithubOutlined } from '@ant-design/icons';
import styles from './SideBar.module.css';
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
      <div className={styles.menuContainer}>
        <div className={styles.menuItems}>
          {/* 导航菜单项 */}
        </div>
      </div>
      
      <div className={styles.actionButtons}>
        <Tooltip title="Help" placement="right">
          <Button 
            type="text" 
            icon={<QuestionCircleOutlined />} 
            onClick={handleOpenGuide}
          />
        </Tooltip>
        
        <Tooltip title="GitHub Repo" placement="right">
          <Button 
            type="text" 
            icon={<GithubOutlined />} 
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
