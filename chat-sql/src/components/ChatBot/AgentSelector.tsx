// 智能体选择组件

import React from 'react';
import {
  Box,
  ButtonGroup,
  Button,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Storage as StorageIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { AgentType, AGENTS_INFO } from '@/types/agents';

interface AgentSelectorProps {
  selectedAgent: AgentType;
  onAgentChange: (agentType: AgentType) => void;
}

// 图标映射
const ICON_MAP = {
  Chat: ChatIcon,
  Storage: StorageIcon,
  AccountTree: AccountTreeIcon,
};

const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentChange,
}) => {
  return (
    <Box sx={{ p: 2, borderBottom: '1px solid var(--card-border)' }}>
      <Typography
        variant="subtitle2"
        sx={{ 
          color: 'var(--secondary-text)', 
          mb: 1,
          fontSize: '0.75rem',
          fontWeight: 500,
        }}
      >
        选择智能体
      </Typography>
      
      <ButtonGroup
        variant="outlined"
        size="small"
        fullWidth
        sx={{
          '& .MuiButton-root': {
            borderColor: 'var(--card-border)',
            color: 'var(--secondary-text)',
            fontSize: '0.75rem',
            py: 0.5,
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          },
        }}
      >
        {Object.values(AGENTS_INFO).map((agent) => {
          const IconComponent = ICON_MAP[agent.icon as keyof typeof ICON_MAP] || ChatIcon;
          const isSelected = selectedAgent === agent.type;
          
          return (
            <Tooltip key={agent.type} title={agent.description} placement="top">
              <Button
                onClick={() => onAgentChange(agent.type)}
                className={isSelected ? 'Mui-selected' : ''}
                startIcon={<IconComponent sx={{ fontSize: '16px !important' }} />}
                sx={{
                  minWidth: 'auto',
                  flex: 1,
                  textTransform: 'none',
                }}
              >
                {agent.name}
              </Button>
            </Tooltip>
          );
        })}
      </ButtonGroup>
    </Box>
  );
};

export default AgentSelector;
