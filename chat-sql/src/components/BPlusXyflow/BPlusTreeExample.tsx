import React, { useState } from 'react';
import { BPlusTreeVisualizer } from './index';

const BPlusTreeExample: React.FC = () => {
  const [initialKeys] = useState<number[]>([10, 20, 5, 15, 25, 3, 7, 12, 18, 22]);
  const [order] = useState<number>(3);

  return (
    <BPlusTreeVisualizer initialKeys={initialKeys} order={order} />
  );
};

export default BPlusTreeExample;
