'use client'

import { useState } from 'react';
import SQLEditor from "@/components/codeEditing/SQLEditor";

export default function Page() {
  const [sqlValue, setSqlValue] = useState(''); // 添加状态管理

  return (
    <SQLEditor 
      value={sqlValue}
      onChange={(newValue) => setSqlValue(newValue)}
      onExecute={(data) => console.log('Query result:', data)}
    />
  );
}
