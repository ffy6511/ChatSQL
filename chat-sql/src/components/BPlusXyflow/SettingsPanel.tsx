import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Divider
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

// 设置接口
interface Settings {
  isAnimationEnabled: boolean;
  animationSpeed: number; // 毫秒
}

// 组件Props接口
interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  // 处理动画开关变化
  const handleAnimationToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      isAnimationEnabled: event.target.checked
    });
  };

  // 处理速度滑块变化
  const handleSpeedChange = (_event: Event, newValue: number | number[]) => {
    onSettingsChange({
      ...settings,
      animationSpeed: newValue as number
    });
  };

  // 速度标记
  const speedMarks = [
    { value: 100, label: '快' },
    { value: 500, label: '中' },
    { value: 1000, label: '慢' },
    { value: 2000, label: '很慢' }
  ];

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SettingsIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="h6">
          动画设置
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* 动画开关 */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.isAnimationEnabled}
              onChange={handleAnimationToggle}
              color="primary"
            />
          }
          label="开启动画"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          {settings.isAnimationEnabled ? '动画模式：逐步显示操作过程' : '静态模式：直接显示最终结果'}
        </Typography>
      </Box>
      
      {/* 动画速度滑块 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          动画速度
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={settings.animationSpeed}
            onChange={handleSpeedChange}
            min={100}
            max={2000}
            step={100}
            marks={speedMarks}
            disabled={!settings.isAnimationEnabled}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}ms`}
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: '0.75rem'
              }
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          当前延迟: {settings.animationSpeed}ms
          {!settings.isAnimationEnabled && ' (动画已关闭)'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SettingsPanel;
