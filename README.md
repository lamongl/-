# 提示词助手 · Prompt Workbench

**实验性办公 Skill：效果与成本仍在验证。**

**Experimental office-work Skill. Quality and efficiency improvements are not established.**

[English](README.en.md) · [在线演示 / Web demo](https://lamongl.github.io/-/) · [下载 Skill / Download](https://github.com/lamongl/-/releases/tag/skill-v0.1.0) · [安装 / Install](docs/skill-release.md) · [对照测试 / Benchmark](docs/benchmarks/README.md) · [反馈 / Issues](https://github.com/lamongl/-/issues)

面向非专业用户的开源办公 Skill，适用于报表分析、文档写作、PPT内容和信息检索摘要。由宿主 AI 理解需求、逐题补充必要信息、筛选执行方案并交付成果。网页版提供手机和电脑可用的模板交互演示。

Open-source office-work Skill for reports, documents, presentation content and research summaries. The host AI clarifies only necessary details, reviews candidate plans and delivers the requested output. The website offers a separate template-based interaction demo.

**网页版是交互演示：使用本地规则和模板，尚未连接 AI。网页版没有实现 11 候选生成、评分或任务执行。**

网页版v0.3支持可选格式/风格、已有资料链接、文本附件、全文复制、TXT下载及设备支持时的系统分享。无需登录，输入不上传、不保存历史。[功能与发布验证](docs/web-v0.3.md)。

## Skill 试用版

现在提供 [prompt-workbench Skill](skills/prompt-workbench/SKILL.md)，由宿主模型按指令进行必要追问、至少11个候选的生成与评审，并直接完成办公任务。用户明确只要提示词时仅输出最终提示词。它不是训练模型，也不提供免费模型算力；实际执行效果受宿主模型与工具限制。

查看 [安装说明与验收案例](docs/skill-release.md)。Codex 安装目录为 `~/.codex/skills/prompt-workbench`；将仓库 `skills/prompt-workbench` 整个文件夹复制进去，再开启新会话使用 `$prompt-workbench`。

版本 v0.1.0 为公开试用，本机安装与销售月报模拟已完成；附件、联网和PPT文件生成尚未全面验收。网页版仍保持原有演示功能。

## 最新复测 / Latest comparison

补充研究：[可复用本地计算组件](docs/benchmarks/2026-10-29-csv-complete/README.md)在一个736行合成表格任务中，两组各两次均通过17项验收；观测到减少返工的收益，但幅度受一次临时编程错误影响。它是组件试验，尚不证明整个Skill提效，不作为产品宣传数字。

Additional research: a [reusable local-calculation component](docs/benchmarks/2026-10-29-csv-complete/README.md) passed 17 checks twice in each condition. Observed savings were strongly affected by one avoided code-generation retry. This is not a whole-Skill efficiency claim.

三个任务各做两次，三组均为6/6满足明确要求，未测得质量提升。精简版相对旧版总token减少9.11%，但比不用Skill多2.27%，本轮耗时更长，且存在宿主隐藏输入变化。精简版仅保留为实验候选，不作为已提效版本发布。[查看原始输出与完整限制](docs/benchmarks/2026-10-28-balanced/README.md)。

All three conditions met the explicit requirements in 6/6 text outputs; no quality advantage was demonstrated. Lean instructions reduced reported tokens versus legacy, but still used more than baseline and did not improve wall time. Hidden-input variation limits causal attribution. The lean candidate is not released as a proven improvement.

## 旧版初测 / Earlier pilot

3个合成任务，每种方式每任务1次，指定相同模型 `gpt-6.1-terra` 与 medium 推理设置。测量包括宿主和Skill输入开销，不是只数最终回答。

| 合计指标 / Aggregate | 不用 Skill / Baseline | 使用 Skill / With Skill |
|---|---:|---:|
| 总 token / Total tokens | 48,746 | 55,144 |
| 最终输出 token / Output tokens | 524 | 358 |
| 墙钟耗时 / Wall time | 33.60秒 | 33.95秒 |

**本轮总token增加13.1%，未测得总体提效。** 输出token减少31.7%，不能据此宣传总成本下降。每组仅1次，缓存与网络不同，也未核验模型内部11候选是否执行，不能推广为普遍效果。

**Total tokens increased by 13.1%; no aggregate speed improvement was observed.** Output tokens decreased by 31.7%, which is not a reduction in total usage. This is a one-run-per-task pilot with cache/network variability; internal 11-candidate compliance was not observed.

完整方法、逐项结果及原始usage见 [对照记录](docs/benchmarks/README.md)。

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
