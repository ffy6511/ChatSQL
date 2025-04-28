'use client'

import React from 'react';
import styles from './NavBar.module.css';

const NavBar: React.FC = () => {
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
        {/* 预留给未来的导航项 */}
      </div>
      
      <div className={styles.rightSection}>
        {/* 预留给未来的操作按钮 */}
      </div>
    </nav>
  );
};

export default NavBar;