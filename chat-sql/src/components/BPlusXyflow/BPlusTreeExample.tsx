import React, { useState, useEffect } from 'react';
import { BPlusTreeVisualizer } from './index';

const BPlusTreeExample: React.FC = () => {
  const [keys, setKeys] = useState<number[]>([10, 20, 5, 15, 25, 3, 7, 12, 18, 22]);
  const [order, setOrder] = useState<number>(3);
  const [newKey, setNewKey] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  const handleAddKey = () => {
    const keyNum = parseInt(newKey);
    if (!isNaN(keyNum) && !keys.includes(keyNum)) {
      setKeys(prevKeys => [...prevKeys, keyNum].sort((a, b) => a - b));
      setNewKey('');
    }
  };

  const handleRemoveKey = (keyToRemove: number) => {
    setKeys(prevKeys => prevKeys.filter(key => key !== keyToRemove));
  };

  const handleClearAll = () => {
    setKeys([]);
  };

  const handleReset = () => {
    setKeys([10, 20, 5, 15, 25, 3, 7, 12, 18, 22]);
  };

  const exampleSets = [
    { name: '简单示例', keys: [1, 2, 3, 4, 5] },
    { name: '中等示例', keys: [10, 20, 5, 15, 25, 3, 7, 12, 18, 22] },
    { name: '复杂示例', keys: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29] },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        padding: '16px', 
        background: isDarkMode ? '#333' : '#f5f5f5',
        borderBottom: `1px solid ${isDarkMode ? '#555' : '#ddd'}`,
        color: isDarkMode ? '#fff' : '#333'
      }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>
          B+树可视化工具 (阶数 M={order})
        </h1>
        
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label>阶数 (M):</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Math.max(2, parseInt(e.target.value) || 2))}
              min="2"
              max="10"
              style={{ 
                width: '60px', 
                padding: '4px',
                background: isDarkMode ? '#555' : '#fff',
                color: isDarkMode ? '#fff' : '#333',
                border: `1px solid ${isDarkMode ? '#666' : '#ccc'}`,
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="输入要插入的键"
              onKeyPress={(e) => e.key === 'Enter' && handleAddKey()}
              style={{ 
                padding: '4px 8px',
                background: isDarkMode ? '#555' : '#fff',
                color: isDarkMode ? '#fff' : '#333',
                border: `1px solid ${isDarkMode ? '#666' : '#ccc'}`,
                borderRadius: '4px'
              }}
            />
            <button 
              onClick={handleAddKey}
              style={{
                padding: '4px 12px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              添加键
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {exampleSets.map((example, index) => (
              <button
                key={index}
                onClick={() => setKeys([...example.keys])}
                style={{
                  padding: '4px 8px',
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {example.name}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleReset}
              style={{
                padding: '4px 12px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重置
            </button>
            <button 
              onClick={handleClearAll}
              style={{
                padding: '4px 12px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              清空
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                padding: '4px 12px',
                background: isDarkMode ? '#666' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isDarkMode ? '亮色' : '暗色'}模式
            </button>
          </div>
        </div>
        
        <div style={{ marginTop: '12px', fontSize: '14px' }}>
          <strong>当前键:</strong> [{keys.join(', ')}]
          {keys.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              {keys.map(key => (
                <span
                  key={key}
                  onClick={() => handleRemoveKey(key)}
                  style={{
                    display: 'inline-block',
                    margin: '2px',
                    padding: '2px 6px',
                    background: '#e0e0e0',
                    color: '#333',
                    borderRadius: '12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title="点击删除"
                >
                  {key} ×
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <BPlusTreeVisualizer initialKeys={keys} order={order} />
      </div>
    </div>
  );
};

export default BPlusTreeExample;
