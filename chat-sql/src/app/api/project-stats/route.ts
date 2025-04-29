import { NextResponse } from 'next/server';
import simpleGit from 'simple-git';

export async function GET() {
  try {
    const git = simpleGit();
    
    // 获取所有提交记录
    const logs = await git.log();
    
    // 获取分支信息
    const branchSummary = await git.branch();
    
    // 获取所有贡献者
    const contributors = new Set(logs.all.map(commit => commit.author_name));

    // 计算活跃分支数量
    // 只统计最近30天有提交的分支
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 获取每个分支的最后提交时间
    const activeBranches = await Promise.all(
      branchSummary.all.map(async (branchName) => {
        try {
          const branchLog = await git.log([branchName, '-1']);
          if (branchLog.latest) {
            const lastCommitDate = new Date(branchLog.latest.date);
            return lastCommitDate > thirtyDaysAgo;
          }
          return false;
        } catch {
          return false;
        }
      })
    );

    const stats = {
      totalCommits: logs.total,
      contributors: Array.from(contributors),
      lastUpdate: logs.latest?.date || '',
      activeBranches: activeBranches.filter(Boolean).length,
      // 添加更多详细信息用于调试
      branchDetails: {
        totalBranches: branchSummary.all.length,
        currentBranch: branchSummary.current,
        branches: branchSummary.all
      }
    };

    // 添加调试日志
    console.log('Branch statistics:', {
      totalBranches: branchSummary.all.length,
      activeBranches: stats.activeBranches,
      currentBranch: branchSummary.current
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching project stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch project stats', details: errorMessage },
      { status: 500 }
    );
  }
}
