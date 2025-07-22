/**
 * B+树历史记录操作栏组件
 * 包含搜索框、删除所有记录按钮和新建记录按钮
 * 参考coding页面的设计风格
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  DeleteSweep as DeleteAllIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface HistoryActionBarProps {
  /** 搜索关键词 */
  searchValue: string;
  /** 搜索变更回调 */
  onSearchChange: (value: string) => void;
  /** 新建记录回调 */
  onCreateNew: () => void;
  /** 删除所有记录回调 */
  onDeleteAll: () => void;
  /** 是否禁用删除所有按钮 */
  disableDeleteAll?: boolean;
}

const HistoryActionBar: React.FC<HistoryActionBarProps> = ({
  searchValue,
  onSearchChange,
  onCreateNew,
  onDeleteAll,
  disableDeleteAll = false
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <Box sx={{ 
      p: 2, 
      borderBottom: '1px solid var(--card-border)',
      bgcolor: 'var(--card-bg)',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      {/* 搜索框 */}
      <TextField
        size="small"
        placeholder="搜索记录"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            bgcolor: isSearchFocused ? 'var(--input-bg)' : 'var(--button-hover)',
            borderRadius: '20px',
            height: '36px',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: isSearchFocused ? 'var(--link-color)' : 'var(--card-border)',
              borderWidth: '1px'
            },
            '&:hover fieldset': {
              borderColor: isSearchFocused ? 'var(--link-color)' : 'var(--secondary-text)'
            },
            '&.Mui-focused fieldset': {
              borderColor: 'var(--link-color)',
              borderWidth: '2px'
            }
          },
          '& .MuiInputBase-input': {
            color: 'var(--primary-text)',
            fontSize: '14px',
            '&::placeholder': {
              color: 'var(--tertiary-text)',
              opacity: 1
            }
          }
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon 
                  sx={{ 
                    color: isSearchFocused ? 'var(--link-color)' : 'var(--tertiary-text)',
                    fontSize: '18px',
                    transition: 'color 0.2s ease'
                  }} 
                />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ 
                    color: 'var(--tertiary-text)',
                    '&:hover': {
                      color: 'var(--secondary-text)',
                      bgcolor: 'transparent'
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }
        }}
      />

      {/* 操作按钮组 */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {/* 删除所有记录按钮 */}
        <Tooltip title="删除所有记录" placement="top">
          <span>
            <IconButton
              size="small"
              onClick={onDeleteAll}
              disabled={disableDeleteAll}
              sx={{
                color: 'var(--tertiary-text)',
                bgcolor: 'transparent',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#d32f2f',
                  bgcolor: 'rgba(211, 47, 47, 0.04)',
                  borderColor: 'rgba(211, 47, 47, 0.2)'
                },
                '&:disabled': {
                  color: 'var(--disabled-text)',
                  bgcolor: 'transparent',
                  borderColor: 'var(--disabled-border)'
                }
              }}
            >
              <DeleteAllIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        {/* 新建记录按钮 - 参考coding模块样式 */}
        <Tooltip title="新建记录" placement="top">
          <Button
            size="small"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={onCreateNew}
            sx={{
              bgcolor: 'var(--link-color)',
              color: 'white',
              borderRadius: '6px',
              height: '32px',
              minWidth: '32px',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: 'none',
              padding: '4px 8px',
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
          />
        </Tooltip>
      </Box>
    </Box>
  );
};

export default HistoryActionBar;
