'use client'

import React, { useEffect, useRef } from 'react';
import { Input, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { KeyboardCommandKey } from '@mui/icons-material';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const inputRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className={styles.searchContainer}>
      <Tooltip
        title={
          <div className="shortcut-tooltip">
            <span>搜索 </span>
            (<KeyboardCommandKey className="shortcut-icon" />
            <span className="shortcut-plus">+</span>
            <span>K</span> )
          </div>
        }
        placement="top"
      >
        <Input
          ref={inputRef}
          placeholder="搜索记录"
          prefix={<SearchOutlined />}
          onChange={(e) => onSearch(e.target.value)}
          className={styles.searchInput}
        />
      </Tooltip>
    </div>
  );
};

export default SearchBar;
