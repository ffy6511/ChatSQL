export function areResultsEqual(actual: any[], expected: any[]): boolean {
  console.log('Comparing results:', { actual, expected });

  if (!actual || !expected) {
    console.log('Invalid input: actual or expected is null/undefined');
    return false;
  }
  
  if (actual.length !== expected.length) {
    console.log('Length mismatch:', { 
      actualLength: actual.length, 
      expectedLength: expected.length 
    });
    return false;
  }

  // 标准化行数据
  function normalizeRow(row: any): any {
    const normalized: any = {};
    for (const [key, value] of Object.entries(row)) {
      // 转换键为小写并移除空格
      const normalizedKey = String(key).toLowerCase().trim();
      // 转换值为字符串并移除前后空格
      const normalizedValue = value === null ? 'null' : String(value).trim();
      normalized[normalizedKey] = normalizedValue;
    }
    return normalized;
  }

  // 标准化并排序两个结果集
  const normalizedActual = actual.map(normalizeRow)
    .sort((a, b) => JSON.stringify(a) > JSON.stringify(b) ? 1 : -1);
  const normalizedExpected = expected.map(normalizeRow)
    .sort((a, b) => JSON.stringify(a) > JSON.stringify(b) ? 1 : -1);

  // 详细的比较日志
  console.log('Normalized results:', {
    actual: normalizedActual,
    expected: normalizedExpected
  });

  // 逐行比较
  for (let i = 0; i < normalizedActual.length; i++) {
    const actualRow = normalizedActual[i];
    const expectedRow = normalizedExpected[i];
    
    // 检查键是否匹配
    const actualKeys = Object.keys(actualRow).sort();
    const expectedKeys = Object.keys(expectedRow).sort();
    
    if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
      console.log('Column mismatch:', {
        actualColumns: actualKeys,
        expectedColumns: expectedKeys
      });
      return false;
    }

    // 检查值是否匹配
    for (const key of actualKeys) {
      if (actualRow[key] !== expectedRow[key]) {
        console.log('Value mismatch:', {
          column: key,
          actualValue: actualRow[key],
          expectedValue: expectedRow[key]
        });
        return false;
      }
    }
  }

  return true;
}
