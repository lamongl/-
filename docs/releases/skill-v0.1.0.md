# Prompt Workbench Skill v0.1.0 — 公开试用

少量必要追问，梳理办公需求，由宿主 AI 完成报表、文档、演示内容和检索摘要。明确只要提示词时交付一份可复制文本。

An open-source office-work Skill for reports, documents, presentation content and research summaries. The host AI asks only necessary questions, reviews candidate plans and executes one. Request prompt-only mode to receive a single reusable prompt instead.

**English installation:** download `prompt-workbench-v0.1.0.zip`, extract the `prompt-workbench` folder into `~/.codex/skills/`, then invoke `$prompt-workbench` in a new turn. No project API key is required; your host's model quota and tool limits still apply.

**English validation:** preview only. Local installation and a synthetic sales-report simulation passed. A three-task paired pilot found total tokens increased by 13.1% and no aggregate speed improvement. Internal 11-candidate execution, attachments, browsing and PPTX generation have not been fully verified. Cloud-host input is not guaranteed to remain local.

## 安装

下载本页附件 `prompt-workbench-v0.1.0.zip` 并解压，将 `prompt-workbench` 文件夹放入 `~/.codex/skills/`。开启下一轮对话，输入 `$prompt-workbench` 和你的需求。无需本项目 API 密钥，宿主模型自身的订阅、额度与工具限制仍适用。

## 首版内容

- 一次一个必要问题，避免重复询问。
- 指令要求至少11个实质不同候选，硬性淘汰、统一评分和胜出复核。
- 默认执行最终方案，可切换仅提示词模式。
- 缺数据、读不到资料或没有文件工具时报告实际限制。

## 验证边界

本机安装与文件一致性检查已通过，完成一个销售月报模拟任务。另有初步对照测试，详见仓库 `docs/benchmarks/README.md`，不保证节省token或提升速度。11候选的模型内部执行尚无自动强制机制；跨平台、真实附件、联网摘要及PPT文件生成未完成全面验收。

这是指令包，不是训练模型；同模型自评不等于独立评测。云端宿主可能处理用户资料，不承诺全部留在本地。

问题反馈请使用仓库 Issues，并仅提交虚构或脱敏资料。
