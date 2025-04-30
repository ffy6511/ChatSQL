const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');

async function generateGitInfo() {
  const git = simpleGit();
  
  // 获取git信息
  const [logs, branchSummary] = await Promise.all([
    git.log({ maxCount: 50 }),
    git.branch()
  ]);

  // 计算活跃分支
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeBranches = await Promise.all(
    branchSummary.all.map(async (branchName) => {
      const branchLog = await git.log([branchName, '-1']);
      return branchLog.latest && new Date(branchLog.latest.date) > thirtyDaysAgo;
    })
  );

  const gitInfo = {
    history: logs.all.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name
    })),
    stats: {
      totalCommits: logs.total,
      contributors: [...new Set(logs.all.map(commit => commit.author_name))],
      lastUpdate: logs.latest?.date || '',
      activeBranches: activeBranches.filter(Boolean).length,
      branchDetails: {
        totalBranches: branchSummary.all.length,
        currentBranch: branchSummary.current,
        branches: branchSummary.all
      }
    }
  };

  // 写入JSON文件
  await fs.writeFile(
    path.join(__dirname, '../public/git_info.json'),
    JSON.stringify(gitInfo, null, 2)
  );
}

generateGitInfo().catch(console.error);