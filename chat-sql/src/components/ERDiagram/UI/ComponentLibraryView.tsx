'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Divider,
  Typography,
} from '@mui/material';
import {
  Apps as AppsIcon,
  BorderAll as BorderAllIcon,
  Diamond as DiamondIcon,
} from '@mui/icons-material';

const ComponentLibraryView: React.FC = () => {
  const handleDragStart = (event: React.DragEvent, componentType: string) => {
    event.dataTransfer.setData('application/reactflow', componentType);
    event.dataTransfer.effectAllowed = 'move';
    (event.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (event: React.DragEvent) => {
    (event.currentTarget as HTMLElement).style.opacity = '1';
  };

  const components = [
    {
      id: 'strong-entity',
      name: 'Strong entity set',
      icon: BorderAllIcon,
      type: 'entity',
      description: 'an entity type that can exist independently and has its own primary key',
      color: '#448fd6', // 蓝色
    },
    {
      id: 'weak-entity',
      name: 'Weak entity set',
      icon: BorderAllIcon,
      type: 'entity',
      description: 'its existence depends on another (strong) entity set',
      color: '#bd62eb', // 紫色
    },
    {
      id: 'relationship',
      name: 'Relationship',
      icon: DiamondIcon,
      type: 'diamond',
      description: 'represents a connection or association between different entity sets',
      color: '#ebcd62', // 绿色
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AppsIcon sx={{ color: '#1976d2', mr: 1 }} /> Component Library
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={1} sx={{ mb: 2 }}>
        {components.map((component) => (
          <Card
            key={component.id}
            sx={{
              cursor: 'grab',
              borderLeft: `6px solid ${component.color}`,
              borderRadius: 2,
              height: 80,
              bgcolor:'var(--component-card)' 
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, component.type)}
            onDragEnd={handleDragEnd}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 , p:1}}>
              <component.icon sx={{ color: component.color }} />
              <Box>
                <Typography fontWeight="bold" color='var(--primary-text)'>{component.name}</Typography>
                <Typography variant="body2" color="var(--secondary-text)">{component.description}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, borderLeft: 3,  bgcolor:'var(--card-border)'  }}>
        <Typography variant="body2" color="var(--secondary-text)">Drag and drop the component on the canvas.. </Typography>
        <Typography variant="body2" color="var(--secondary-text)">Double-click the node on the canvas to edit the name.</Typography>
      </Box>
    </Box>
  );
};

export default ComponentLibraryView;
