'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider
} from '@mui/material';
import { 
  AccountTree as DiagramIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  LocalLibrary as LibraryIcon
} from '@mui/icons-material';

import ERDiagram from '../../components/ERDiagram/ERDiagram';
import { ERDiagramData, sampleERData, employeeDepartmentERData } from '../../types/erDiagram';

// 额外的示例数据
const businessERData: ERDiagramData = {
  entities: [
    {
      id: "ent_customer",
      name: "客户",
      description: "公司的客户信息",
      attributes: [
        { id: "attr_cust_id", name: "客户ID", isPrimaryKey: true, dataType: "VARCHAR(20)", isRequired: true },
        { id: "attr_cust_name", name: "客户名称", dataType: "VARCHAR(100)", isRequired: true },
        { id: "attr_cust_email", name: "邮箱", dataType: "VARCHAR(100)" },
        { id: "attr_cust_phone", name: "电话", dataType: "VARCHAR(20)" },
        { id: "attr_cust_address", name: "地址", dataType: "TEXT" }
      ]
    },
    {
      id: "ent_order",
      name: "订单",
      description: "客户的订单信息",
      attributes: [
        { id: "attr_order_id", name: "订单ID", isPrimaryKey: true, dataType: "VARCHAR(20)", isRequired: true },
        { id: "attr_order_date", name: "订单日期", dataType: "DATE", isRequired: true },
        { id: "attr_order_total", name: "订单总额", dataType: "DECIMAL(10,2)", isRequired: true },
        { id: "attr_order_status", name: "订单状态", dataType: "VARCHAR(20)" },
        { id: "attr_cust_id_fk", name: "客户ID", dataType: "VARCHAR(20)", isRequired: true }
      ]
    },
    {
      id: "ent_product",
      name: "产品",
      description: "公司的产品信息",
      attributes: [
        { id: "attr_prod_id", name: "产品ID", isPrimaryKey: true, dataType: "VARCHAR(20)", isRequired: true },
        { id: "attr_prod_name", name: "产品名称", dataType: "VARCHAR(100)", isRequired: true },
        { id: "attr_prod_price", name: "产品价格", dataType: "DECIMAL(8,2)", isRequired: true },
        { id: "attr_prod_stock", name: "库存数量", dataType: "INT" },
        { id: "attr_prod_category", name: "产品类别", dataType: "VARCHAR(50)" }
      ]
    }
  ],
  relationships: [
    {
      id: "rel_places",
      name: "下单",
      description: "客户下订单的关系",
      connections: [
        { entityId: "ent_customer", cardinality: "1..1", role: "下单客户" },
        { entityId: "ent_order", cardinality: "0..*", role: "客户订单" }
      ]
    },
    {
      id: "rel_contains",
      name: "包含",
      description: "订单包含产品的关系",
      connections: [
        { entityId: "ent_order", cardinality: "0..*", role: "相关订单" },
        { entityId: "ent_product", cardinality: "0..*", role: "订单产品" }
      ],
      attributes: [
        { id: "attr_quantity", name: "数量", dataType: "INT", isRequired: true },
        { id: "attr_unit_price", name: "单价", dataType: "DECIMAL(8,2)", isRequired: true }
      ]
    }
  ],
  metadata: {
    title: "电商业务ER图",
    description: "展示客户、订单、产品之间关系的实体关系图",
    version: "1.0.0"
  }
};

const libraryERData: ERDiagramData = {
  entities: [
    {
      id: "ent_reader",
      name: "读者",
      attributes: [
        { id: "attr_reader_id", name: "读者证号", isPrimaryKey: true, dataType: "VARCHAR(20)", isRequired: true },
        { id: "attr_reader_name", name: "姓名", dataType: "VARCHAR(50)", isRequired: true },
        { id: "attr_reader_type", name: "读者类型", dataType: "VARCHAR(20)" }
      ]
    },
    {
      id: "ent_book",
      name: "图书",
      attributes: [
        { id: "attr_book_id", name: "图书编号", isPrimaryKey: true, dataType: "VARCHAR(20)", isRequired: true },
        { id: "attr_book_title", name: "书名", dataType: "VARCHAR(200)", isRequired: true },
        { id: "attr_book_author", name: "作者", dataType: "VARCHAR(100)" },
        { id: "attr_book_isbn", name: "ISBN", dataType: "VARCHAR(20)" }
      ]
    }
  ],
  relationships: [
    {
      id: "rel_borrows",
      name: "借阅",
      connections: [
        { entityId: "ent_reader", cardinality: "0..*", role: "借阅者" },
        { entityId: "ent_book", cardinality: "0..*", role: "被借图书" }
      ],
      attributes: [
        { id: "attr_borrow_date", name: "借阅日期", dataType: "DATE", isRequired: true },
        { id: "attr_return_date", name: "归还日期", dataType: "DATE" }
      ]
    }
  ],
  metadata: {
    title: "图书馆管理ER图",
    description: "图书馆读者借阅系统的实体关系图",
    version: "1.0.0"
  }
};

export default function ERDiagramTestPage() {
  const [currentData, setCurrentData] = useState<ERDiagramData>(sampleERData);
  const [selectedExample, setSelectedExample] = useState<string>('school');

  const examples = [
    {
      id: 'school',
      title: '学生选课系统',
      description: '展示学生、课程、教师之间的关系',
      icon: <SchoolIcon />,
      data: sampleERData,
      color: 'primary'
    },
    {
      id: 'business',
      title: '电商业务系统',
      description: '展示客户、订单、产品之间的关系',
      icon: <BusinessIcon />,
      data: businessERData,
      color: 'secondary'
    },
    {
      id: 'library',
      title: '图书馆管理',
      description: '展示读者和图书借阅关系',
      icon: <LibraryIcon />,
      data: libraryERData,
      color: 'success'
    },
    {
      id: 'employee',
      title: '员工部门项目',
      description: '展示员工、部门、项目关系及参与约束',
      icon: <BusinessIcon />,
      data: employeeDepartmentERData,
      color: 'info'
    }
  ];

  const handleExampleChange = (exampleId: string, data: ERDiagramData) => {
    setSelectedExample(exampleId);
    setCurrentData(data);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
          <DiagramIcon sx={{ fontSize: 'inherit', mr: 2, verticalAlign: 'middle' }} />
          ER图可视化工具
        </Typography>
        <Typography variant="h6" color="text.secondary">
          基于 React Flow 构建的实体关系图可视化组件
        </Typography>
      </Box>

      {/* 示例选择器 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          选择示例
        </Typography>
        <Grid container spacing={3}>
          {examples.map((example) => (
            <Grid size={{ xs: 12, md: 4 }} key={example.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: selectedExample === example.id ? 2 : 1,
                  borderColor: selectedExample === example.id ? `${example.color}.main` : 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleExampleChange(example.id, example.data)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: `${example.color}.main`, mr: 1 }}>
                      {example.icon}
                    </Box>
                    <Typography variant="h6" component="h3">
                      {example.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {example.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${example.data.entities.length} 个实体`} 
                      size="small" 
                      color={example.color as any}
                      variant="outlined"
                    />
                    <Chip 
                      label={`${example.data.relationships.length} 个关系`} 
                      size="small" 
                      color={example.color as any}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color={example.color as any}
                    disabled={selectedExample === example.id}
                  >
                    {selectedExample === example.id ? '当前选择' : '查看此示例'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* ER图可视化区域 */}
      <Paper sx={{ p: 2, height: '70vh', minHeight: '500px' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, px: 2 }}>
          {currentData.metadata?.title || 'ER图可视化'}
        </Typography>
        <Box sx={{ height: 'calc(100% - 60px)', border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <ERDiagram
            key={selectedExample} // 强制重新挂载组件
            data={currentData}
            showControls={true}
            showBackground={true}
            onNodeClick={(node) => {
              console.log('节点被点击:', node);
            }}
            onEdgeClick={(edge) => {
              console.log('边被点击:', edge);
            }}
          />
        </Box>
      </Paper>

      {/* 使用说明 */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          使用说明
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom color="primary">
              功能特性
            </Typography>
            <ul>
              <li>支持实体和关系的可视化展示</li>
              <li>自动布局算法</li>
              <li>交互式缩放和平移</li>
              <li>小地图导航</li>
              <li>节点和边的点击事件</li>
              <li>响应式设计</li>
            </ul>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom color="primary">
              操作指南
            </Typography>
            <ul>
              <li>使用鼠标滚轮进行缩放</li>
              <li>拖拽画布进行平移</li>
              <li>点击节点查看详细信息</li>
              <li>使用右上角控制按钮</li>
              <li>查看左上角的图表信息</li>
              <li>使用小地图快速导航</li>
            </ul>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
