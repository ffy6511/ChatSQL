import { NextResponse } from 'next/server';
import { GitInfo } from '@/types/git';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取 JSON 文件
const gitInfoData: GitInfo = JSON.parse(
  readFileSync(join(process.cwd(), 'public', 'git_info.json'), 'utf-8')
);

export async function GET() {
  return NextResponse.json(gitInfoData.history);
}
