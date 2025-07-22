'use client'

import React from 'react';
import { Button, Tooltip } from 'antd';
import { HomeOutlined, HistoryOutlined, CodeOutlined, DatabaseOutlined, PartitionOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import styles from './NavBar.module.css';
import ShareButton from './ShareButton';

const NavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

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
        <div className={styles.navTabs}>
          <Tooltip title="SQL练习">
            <Button
              type={isActive('/') ? 'primary' : 'text'}
              icon={<CodeOutlined />}
              onClick={() => router.push('/')}
              className={`${styles.tabButton} ${isActive('/') ? styles.activeTab : ''}`}
            >
              Coding
            </Button>
          </Tooltip>

          <Tooltip title="ER图建模">
            <Button
              type={isActive('/er-diagram') ? 'primary' : 'text'}
              icon={<DatabaseOutlined />}
              onClick={() => router.push('/er-diagram')}
              className={`${styles.tabButton} ${isActive('/er-diagram') ? styles.activeTab : ''}`}
            >
              ER-Graph
            </Button>
          </Tooltip>

          <Tooltip title="B+树可视化">
            <Button
              type={isActive('/Bplus') ? 'primary' : 'text'}
              icon={<PartitionOutlined />}
              onClick={() => router.push('/Bplus')}
              className={`${styles.tabButton} ${isActive('/Bplus') ? styles.activeTab : ''}`}
            >
              BPlus
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className={styles.rightSection}>
        <ShareButton />
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
