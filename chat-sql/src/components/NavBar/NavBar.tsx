'use client'

import React from 'react';
import { Button, Tooltip } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import styles from './NavBar.module.css';

const NavBar: React.FC = () => {
  const router = useRouter();

  return (
    <nav className={styles.navBar}>
      <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <img 
            src="/assets/logo.svg"
            alt="Logo"
            className={styles.logoImage}
          />
          <h2 className={styles.logoText}>ChatSQL</h2>
        </div>
      </div>
      
      <div className={styles.middleSection}>

      </div>
      
      <div className={styles.rightSection}>
        <Tooltip title="返回主页">
          <Button 
            type="text" 
            icon={<HomeOutlined />}
            onClick={() => router.push('/')}
            className={styles.navButton}
          />
        </Tooltip>
        <Tooltip title="更新日志">
          <Button 
            type="text" 
            icon={<HistoryOutlined />}
            onClick={() => router.push('/changelog')}
            className={styles.navButton}
          />
        </Tooltip>
      </div>
    </nav>
  );
};

export default NavBar;
