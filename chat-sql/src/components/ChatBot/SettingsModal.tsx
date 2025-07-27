// 设置Modal组件

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Science as TestIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { SettingsModalProps, ChatSettings } from '@/types/chatbot';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <Box hidden={value !== index} sx={{ height: '100%' }}>
      {value === index && <Box sx={{ p: 3, height: '100%' }}>{children}</Box>}
    </Box>
  );
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  settings,
  onSave,
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState<ChatSettings>(settings);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 监听设置变化
  useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings, open]);

  // 检查是否有变化
  useEffect(() => {
    const hasChanged = JSON.stringify(formData) !== JSON.stringify(settings);
    setHasChanges(hasChanged);
  }, [formData, settings]);

  // 处理表单数据变化
  const handleFormChange = (field: keyof ChatSettings, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setTestResult(null); // 清除测试结果
  };

  // 测试API连接
  const handleTestConnection = async () => {
    if (!formData.apiKey.trim()) {
      setTestResult({
        success: false,
        message: '请先输入API Key',
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // 模拟API测试
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 这里应该调用真实的API测试
      const success = Math.random() > 0.3; // 模拟成功率
      
      setTestResult({
        success,
        message: success ? 'API连接测试成功！' : 'API连接测试失败，请检查配置',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: '连接测试失败',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 保存设置
  const handleSave = () => {
    onSave(formData);
    setHasChanges(false);
  };

  // 重置设置
  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
    setTestResult(null);
  };

  // 导出设置
  const handleExportSettings = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chatbot-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 导入设置
  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedSettings = JSON.parse(e.target?.result as string);
            setFormData(importedSettings);
          } catch (error) {
            console.error('Failed to import settings:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '70vh',
          backgroundColor: 'var(--card-bg)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--divider-color)',
          color: 'var(--primary-text)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6">聊天设置</Typography>
          {hasChanges && (
            <Typography
              variant="caption"
              sx={{
                color: 'warning.main',
                backgroundColor: 'warning.light',
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              有未保存的更改
            </Typography>
          )}
        </Box>
        
        <IconButton onClick={onClose} sx={{ color: 'var(--icon-color)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'var(--secondary-text)',
            },
            '& .Mui-selected': {
              color: 'var(--primary-text)',
            },
          }}
        >
          <Tab label="系统提示词" />
          <Tab label="API设置" />
          <Tab label="高级设置" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        {/* Tab 1: 系统提示词 */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-text)' }}>
              系统提示词配置
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'var(--secondary-text)' }}>
              系统提示词将告诉AI如何回应用户的问题，您可以根据需要自定义AI的行为和专业领域。
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={12}
              label="系统提示词"
              value={formData.systemPrompt}
              onChange={(e) => handleFormChange('systemPrompt', e.target.value)}
              placeholder="请输入系统提示词..."
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--input-bg)',
                  height: '100%',
                  alignItems: 'flex-start',
                },
                '& .MuiInputBase-input': {
                  color: 'var(--input-text)',
                  height: '100% !important',
                },
              }}
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: 'var(--secondary-text)', width: '100%' }}>
                快捷模板：
              </Typography>
              {[
                '专业的SQL助手',
                'ER图设计专家',
                'B+树算法导师',
                '数据库优化顾问',
              ].map((template) => (
                <Button
                  key={template}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const prompts = {
                      '专业的SQL助手': '你是一个专业的SQL助手，擅长编写、优化和解释SQL查询语句。',
                      'ER图设计专家': '你是一个ER图设计专家，能够帮助用户设计合理的实体关系模型。',
                      'B+树算法导师': '你是一个B+树算法导师，能够详细解释B+树的原理和操作过程。',
                      '数据库优化顾问': '你是一个数据库优化顾问，专注于数据库性能调优和架构设计。',
                    };
                    handleFormChange('systemPrompt', prompts[template as keyof typeof prompts]);
                  }}
                >
                  {template}
                </Button>
              ))}
            </Box>
          </Box>
        </TabPanel>

        {/* Tab 2: API设置 */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-text)' }}>
              API配置
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              {/* API平台选择 */}
              <FormControl fullWidth>
                <InputLabel>API平台</InputLabel>
                <Select
                  value={formData.apiPlatform}
                  label="API平台"
                  onChange={(e) => handleFormChange('apiPlatform', e.target.value)}
                  sx={{
                    backgroundColor: 'var(--input-bg)',
                    '& .MuiSelect-select': {
                      color: 'var(--input-text)',
                    },
                  }}
                >
                  <MenuItem value="bailianai">百炼AI</MenuItem>
                  <MenuItem value="dify">Dify</MenuItem>
                </Select>
              </FormControl>

              {/* API Key */}
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={formData.apiKey}
                onChange={(e) => handleFormChange('apiKey', e.target.value)}
                placeholder="请输入API Key"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--input-text)',
                  },
                }}
                helperText="API Key将用于调用AI服务，请确保密钥的安全性"
              />

              {/* API端点 (仅Dify显示) */}
              {formData.apiPlatform === 'dify' && (
                <TextField
                  fullWidth
                  label="API端点"
                  value={formData.apiEndpoint || ''}
                  onChange={(e) => handleFormChange('apiEndpoint', e.target.value)}
                  placeholder="https://api.dify.ai/v1"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--input-bg)',
                    },
                    '& .MuiInputBase-input': {
                      color: 'var(--input-text)',
                    },
                  }}
                  helperText="Dify API的完整端点地址"
                />
              )}

              {/* 连接测试 */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={isTestingConnection ? <CircularProgress size={16} /> : <TestIcon />}
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !formData.apiKey.trim()}
                  >
                    {isTestingConnection ? '测试中...' : '测试连接'}
                  </Button>

                  {testResult && (
                    <Alert
                      severity={testResult.success ? 'success' : 'error'}
                      sx={{ flex: 1 }}
                    >
                      {testResult.message}
                    </Alert>
                  )}
                </Box>

                <Typography variant="caption" sx={{ color: 'var(--secondary-text)' }}>
                  建议在保存设置前测试API连接是否正常
                </Typography>
              </Box>

              <Divider />

              {/* 导入导出设置 */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--primary-text)' }}>
                  设置管理
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="导出当前设置">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportSettings}
                    >
                      导出设置
                    </Button>
                  </Tooltip>
                  <Tooltip title="从文件导入设置">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={handleImportSettings}
                    >
                      导入设置
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Tab 3: 高级设置 */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-text)' }}>
              高级设置
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              {/* 流式响应开关 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableStreaming ?? true}
                    onChange={(e) => handleFormChange('enableStreaming', e.target.checked)}
                    color="primary"
                  />
                }
                label="启用流式响应"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    color: 'var(--primary-text)',
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: 'var(--secondary-text)', mt: -2 }}>
                流式响应可以实时显示AI的回复过程，提供更好的交互体验
              </Typography>

              {/* 温度设置 */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--primary-text)' }}>
                  创造性 (Temperature): {formData.temperature ?? 0.7}
                </Typography>
                <Box sx={{ px: 2 }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature ?? 0.7}
                    onChange={(e) => handleFormChange('temperature', parseFloat(e.target.value))}
                    aria-label="Temperature setting"
                    title="调整AI回复的创造性程度"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'var(--secondary-text)' }}>
                    保守 (0.0)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--secondary-text)' }}>
                    创新 (1.0)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'var(--secondary-text)', display: 'block', mt: 1 }}>
                  较低的值使输出更加确定和一致，较高的值使输出更加多样和创新
                </Typography>
              </Box>

              {/* 最大令牌数设置 */}
              <TextField
                fullWidth
                label="最大令牌数"
                type="number"
                value={formData.maxTokens ?? 2000}
                onChange={(e) => handleFormChange('maxTokens', parseInt(e.target.value) || 2000)}
                inputProps={{
                  min: 100,
                  max: 8000,
                  step: 100,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--input-text)',
                  },
                }}
                helperText="控制AI回复的最大长度，较大的值允许更长的回复但消耗更多资源"
              />

              <Divider />

              {/* 性能提示 */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>性能提示：</strong>
                  <br />
                  • 流式响应提供更好的用户体验，但可能增加网络开销
                  <br />
                  • 较高的温度值会产生更多样的回复，但可能降低准确性
                  <br />
                  • 增加最大令牌数可以获得更详细的回复，但会增加响应时间
                </Typography>
              </Alert>
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid var(--divider-color)', p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="重置为当前保存的设置">
              <Button
                startIcon={<RestoreIcon />}
                onClick={handleReset}
                disabled={!hasChanges}
              >
                重置
              </Button>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose}>取消</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              保存设置
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
