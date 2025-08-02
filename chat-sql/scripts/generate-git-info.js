const simpleGit = require("simple-git");
const fs = require("fs").promises;
const path = require("path");

// 设置描述的最大字符数
const MAX_DESCRIPTION_LENGTH = 400;

async function generateGitInfo() {
  const git = simpleGit();

  // 获取git信息
  const [logs, branchSummary] = await Promise.all([
    git.log({ maxCount: 50 }),
    git.branch(),
  ]);

  // 获取每个提交的详细描述
  const commitsWithDescription = await Promise.all(
    logs.all.map(async (commit) => {
      try {
        // 使用 git show 命令获取完整的提交信息
        const result = await git.raw([
          "show",
          commit.hash,
          "--no-patch",
          "--format=%B",
        ]);

        // 分离提交消息的标题和详细描述
        const lines = result.trim().split("\n");
        const title = lines[0]; // 第一行是标题

        // 跳过第一行和空行，获取详细描述
        let description = "";
        if (lines.length > 1) {
          const descLines = lines.slice(1).filter((line) => line.trim() !== "");
          if (descLines.length > 0) {
            description = descLines.join("\n");

            // 限制描述的长度
            if (description.length > MAX_DESCRIPTION_LENGTH) {
              description =
                description.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
            }
          }
        }

        console.log(`Commit ${commit.hash.substring(0, 7)}:`);
        console.log(`Title: ${title}`);
        console.log(
          `Description: ${description ? description.substring(0, 50) + "..." : "(no description)"}`,
        );
        console.log("---");

        return {
          hash: commit.hash,
          date: commit.date,
          message: title, // 使用标题作为消息
          description: description, // 添加详细描述
          author: commit.author_name,
        };
      } catch (error) {
        console.error(`Error processing commit ${commit.hash}:`, error);
        return {
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          description: "",
          author: commit.author_name,
        };
      }
    }),
  );

  // 按日期分组提交
  const commitsByDate = {};
  commitsWithDescription.forEach((commit) => {
    const date = new Date(commit.date).toLocaleDateString("zh-CN");
    if (!commitsByDate[date]) {
      commitsByDate[date] = [];
    }
    commitsByDate[date].push(commit);
  });

  const gitInfo = {
    history: commitsWithDescription,
    commitsByDate: commitsByDate,
    stats: {
      totalCommits: logs.total,
      contributors: [...new Set(logs.all.map((commit) => commit.author_name))],
      lastUpdate: logs.latest?.date || "",
      activeBranches: branchSummary.all.length,
    },
  };

  // 写入JSON文件
  await fs.writeFile(
    path.join(__dirname, "../public/git_info.json"),
    JSON.stringify(gitInfo, null, 2),
  );

  console.log("Git info generated successfully!");
}

generateGitInfo().catch(console.error);
