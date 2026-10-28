# 提示词助手 · Prompt Workbench

把办公需求整理成可以复制给 AI 的提示词。适用于报表分析、文档写作、PPT 制作与信息检索摘要，支持手机与电脑。

**网页版是交互演示：使用本地规则和模板，尚未连接 AI。网页版没有实现 11 候选生成、评分或任务执行。**

## Skill 试用版

现在提供 [prompt-workbench Skill](skills/prompt-workbench/SKILL.md)，由宿主模型按指令进行必要追问、至少11个候选的生成与评审，并直接完成办公任务。用户明确只要提示词时仅输出最终提示词。它不是训练模型，也不提供免费模型算力；实际执行效果受宿主模型与工具限制。

查看 [安装说明与验收案例](docs/skill-release.md)。Codex 安装目录为 `~/.codex/skills/prompt-workbench`；将仓库 `skills/prompt-workbench` 整个文件夹复制进去，再开启新会话使用 `$prompt-workbench`。

版本 v0.1.0 为公开试用，尚未完成真实安装后的全套行为验收。网页版仍保持原有演示功能。

## 功能

- 四类任务入口，逐个询问缺少的关键信息。
- 本地读取 UTF-8 TXT、MD、CSV：最多 3 份，每份 200 KB。
- 将资料原文、任务和修改要求合并成一份可复制的提示词草稿。
- 返回修改保留已有回答；新建任务前保护未保存内容。

## 本地运行

需要 Node.js 22 或更高版本，无第三方运行依赖，无需 npm install。

```sh
npm start
```

打开 http://127.0.0.1:4173/ 。不要直接双击 HTML：浏览器对本地 ES 模块的限制可能导致功能无法加载。

```sh
npm test
npm run build
```

发布产物为 `dist/`，仅包含网页必需的静态文件。支持部署在域名根目录或 `/仓库名/` 子目录。

## 发布到 GitHub Pages

1. 创建公开仓库，把本项目提交到 `main` 分支。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在 **Actions → Publish GitHub Pages → Run workflow** 手动执行首次发布；后续推送到 `main` 自动更新。
4. 工作流成功后，从 `github-pages` 部署环境打开实际网址。通常为 `https://你的用户名.github.io/仓库名/`。

仓库地址用于查看源代码，Pages 地址用于直接使用网页。未完成部署前，示例网址不代表已上线。

流程依据：[GitHub 官方自定义 Pages 工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 隐私与边界

应用不上传输入和附件、不接入模型接口、不使用分析脚本、不保存历史。内容只保留在当前页面内存，关闭或刷新会丢失。复制后的文本是否发送给其他 AI，由使用者决定。

访问公开站点会向 GitHub Pages 请求网页资源；托管服务可以处理访问日志等网络信息。因此“内容在浏览器处理”不代表完全没有网络请求。

页面以 CSP 限制联网和第三方资源。未来接入 AI 时，需要重新明确数据流向、密钥管理及隐私说明，不能沿用本版本承诺。

## 项目结构

- `web/`：界面、规则、模板及本地预览服务。
- `scripts/`：静态发布构建及测试。
- `.github/workflows/pages.yml`：测试、构建、部署。
- `docs/`：产品方案与评估记录（开发工作区中保留）。

MIT License。欢迎通过 Issue 提交可复现问题；请使用虚构数据，不要公开真实业务资料、账号或密钥。
