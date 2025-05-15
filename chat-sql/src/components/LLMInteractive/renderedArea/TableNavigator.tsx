import React, { useState, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import ListIcon from '@mui/icons-material/List';
import { styled } from '@mui/material/styles';
import { Table } from '@/types/database';
import styles from './TableNavigator.module.css';

// 组件 Props 类型
interface TableNavigatorProps {
  tables: Table[];
}

// 自定义主按钮样式
const FloatingButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  left: 6,
  zIndex: 20,
  background: theme.palette.background.paper,
  backgroundColor: 'transparent',
  boxShadow: theme.shadows[3],
  '&:hover': {
    background: theme.palette.grey[200],
  },
  width: 30,
  height: 30,
}));

// 自定义弹窗样式
const StyledPaper = styled(Paper)(({ theme }) => ({
  minWidth: 420,
//   maxWidth: 320,
  maxHeight: 400,
  overflow: 'auto',
  borderRadius: 12,
  boxShadow: theme.shadows[6],
  padding: theme.spacing(1, 0, 1, 0),
}));

/**
 * TableNavigator 组件
 * 左上角点击按钮弹出可搜索的表格列表，点击可定位表格
 */
export const TableNavigator: React.FC<TableNavigatorProps> = ({ tables }) => {
  const { setCenter, getNode } = useReactFlow();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [search, setSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 过滤表格
  const filteredTables = tables.filter(table =>
    table.tableName.toLowerCase().includes(search.toLowerCase())
  );

  // 定位表格并关闭弹窗
  const handleTableClick = (tableId: string) => {
    const node = getNode(tableId);
    if (node) {
      // 尽可能定位到中心
      const offsetX = 100; 
      const offsetY = 100; 
      setCenter(node.position.x + offsetX, node.position.y + offsetY, {
        duration: 500,
        zoom: 0.8,
      });
    }
    setAnchorEl(null);
  };

  // 点击按钮时打开/关闭弹窗
  const handleButtonClick = () => {
    if (anchorEl) {
      setAnchorEl(null);
    } else if (buttonRef.current) {
      setAnchorEl(buttonRef.current);
    }
  };

  // 关闭弹窗
  const handlePopoverClose = () => setAnchorEl(null);

  return (
    <>
      {/* 点击按钮 */}
      <FloatingButton
        ref={buttonRef}
        onClick={handleButtonClick}
        size="small"
        aria-label="快速表导航"
      >
        <ListIcon fontSize="medium" />
      </FloatingButton>
      {/* 弹出面板 */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          className: styles.tableListContainer,
          elevation: 6,
        }}
        disableRestoreFocus
      >
        <TextField
          size="small"
          placeholder="定位table"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          className={styles.searchInput}
          sx={{ m: 1, mb: 0.5, minWidth: 0, maxWidth: '100%' }} // 保证输入框宽度自适应
        />
        <List dense className={styles.tableList}>
          {filteredTables.length === 0 ? (
            <ListItem>
              <ListItemText primary="无匹配表格" className={styles.noMatch} />
            </ListItem>
          ) : (
            filteredTables.map(table => (
              <ListItem key={table.id} disablePadding className={styles.tableListItem}>
                <ListItemButton onClick={() => handleTableClick(table.id)} className={styles.tableListItemButton}>
                  <ListItemText primary={table.tableName} className={styles.tableListText} />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Popover>
    </>
  );
};

export default TableNavigator;