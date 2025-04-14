import { Box } from '@mui/material';
import { transformTableData } from '@/lib/tableDataTransform';

const sampleData = [
  {
    tableName: 'users',
    tupleData: [
      {
        id: 1,
        username: 'john_doe',
        email: 100
      },
      {
        id: 2,
        username: 'jane_smith',
        email: 101
      }
    ]
  },
  {
    tableName: 'orders',
    tupleData: [
      {
        order_id: 1,
        user_id: 100,
        amount: 99.99
      },
      {
        order_id: 2,
        user_id: 101,
        amount: 149.50
      }
    ]
  }
];

export default function TupleViewer() {
  return (
    <Box sx={{ p: 2 }}>
      {transformTableData(sampleData)}
    </Box>
  );
}