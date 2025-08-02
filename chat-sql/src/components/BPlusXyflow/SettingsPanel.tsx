import React from "react";
import {
  Box,
  Paper,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Divider,
  TextField,
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";

// 设置接口
interface Settings {
  isAnimationEnabled: boolean;
  animationSpeed: number; // 毫秒
  order: number; // 阶数M
}

// 组件Props接口
interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  disabled?: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  disabled = false,
}) => {
  // 处理动画开关变化
  const handleAnimationToggle = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onSettingsChange({
      ...settings,
      isAnimationEnabled: event.target.checked,
    });
  };

  // 处理速度滑块变化
  const handleSpeedChange = (_event: Event, newValue: number | number[]) => {
    onSettingsChange({
      ...settings,
      animationSpeed: newValue as number,
    });
  };

  // 处理阶数变化
  const handleOrderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOrder = parseInt(event.target.value);
    if (newOrder >= 3 && newOrder <= 10) {
      // 限制阶数范围
      onSettingsChange({
        ...settings,
        order: newOrder,
      });
    }
  };

  // 速度标记
  const speedMarks = [
    { value: 100, label: "快" },
    { value: 500, label: "中" },
    { value: 1000, label: "慢" },
    { value: 2000, label: "很慢" },
  ];

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <SettingsIcon sx={{ mr: 1, color: "text.secondary" }} />
        <Typography variant="h6">设置</Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 动画开关和阶数设置 - 水平排列 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 4, mb: 3 }}>
        {/* 动画开关 */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={settings.isAnimationEnabled}
                onChange={handleAnimationToggle}
                color="primary"
                disabled={disabled}
              />
            }
            label="开启动画"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            {settings.isAnimationEnabled
              ? "动画模式：逐步显示操作过程"
              : "静态模式：直接显示最终结果"}
          </Typography>
        </Box>

        {/* 阶数设置 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body1">B+树阶数 (M):</Typography>
          <TextField
            type="number"
            value={settings.order}
            onChange={handleOrderChange}
            size="small"
            inputProps={{ min: 3, max: 10, step: 1 }}
            sx={{ width: "80px" }}
            disabled={disabled}
          />
          <Typography variant="body2" color="text.secondary">
            (3-10)
          </Typography>
        </Box>
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
            disabled={disabled || !settings.isAnimationEnabled}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}ms`}
            sx={{
              "& .MuiSlider-markLabel": {
                fontSize: "0.75rem",
              },
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          当前延迟: {settings.animationSpeed}ms
          {!settings.isAnimationEnabled && " (动画已关闭)"}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SettingsPanel;
