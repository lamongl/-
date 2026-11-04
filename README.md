# 成品工作台 · Deliver Workbench

**把材料交给当前 AI，通过必要追问直接拿到成品。**

[打开产品首页](https://lamongl.github.io/-/) · [直接下载 Skill v1.4.1](https://lamongl.github.io/-/deliver-workbench/SKILL.md) · [安装说明](skills/deliver-workbench/INSTALL.md) · [真实工作台界面](https://lamongl.github.io/-/#workbench) · [真实成果与对照记录](https://lamongl.github.io/-/#results) · [English](README.en.md)

成品工作台是一个开源 Skill 与本地 MCP 连接器。用户在界面提交材料和需求，当前宿主 AI 读取材料、分轮澄清、组织内容，使用已有工具制作并检查实际文件，最终在工作台下载。无需手动复制中间提示词。

网页是产品介绍、成果展示和安装入口；安装后的本地工作台才连接当前 AI。Codex 的 MCP 流程已经验证。豆包安装记录暴露了依赖下载、宿主注册和手动桥接问题，1.4.1补充了安装恢复与命令行接入，仍需在实际客户端验收原生 MCP 注册。其他 Agent 按各自版本的真实能力接入。模型和额度由宿主提供，本项目不提供免费算力或跨平台登录授权。

## 安装与接入

从 [Markdown 安装说明](https://lamongl.github.io/-/deliver-workbench/INSTALL.md) 开始。

```text
请读取 https://lamongl.github.io/-/deliver-workbench/INSTALL.md，先帮我安装并验收 MCP，再启用成品工作台。
```

Agent先安装本地服务，再配置宿主 MCP，确认宿主能实际调用七个工具后启用 Skill。服务端自检与宿主工具加载分别验收。豆包等环境无法接入 MCP 时，自动沿用原有 Markdown 还原与 CLI 安装流程，明确报告实际接入方式。MCP 接续长轮询、CLI 使用 --follow 持续等待，让界面提交与回答后直接接续制作；宿主需具备持续工具任务能力。安装后说“使用成品工作台，我要上传材料并直接拿到成品”。

[Agent安装入口](skills/deliver-workbench/INSTALL.md) · [手动安装说明](skills/deliver-workbench/references/setup.md) · [功能与边界](docs/delivery-workbench.md)

## 支持范围

- 最多5份，每份20MB；DOCX、XLSX、XLS、PPTX、文字型PDF、TXT、MD、CSV。
- 先读材料再分轮追问；完整需求不重复问；制作前组织主线和证据，交付前检查实际文件。
- 扫描PDF需先识别文字，旧DOC/PPT需转换。成品格式由宿主工具决定。
- 材料保存在本机，当前云端AI仍可能接收材料。保持AI对话运行；提交不能保证自动唤醒已结束的会话。

## 对照成果

同一论文、同一继承模型及底层工具，统一8页、5分钟、英文页面、中文讲稿和8组问答。两组独立制作，再匿名评审。

[使用Skill的PPT](https://lamongl.github.io/-/downloads/with-skill.pptx) · [未使用工作台Skill的PPT](https://lamongl.github.io/-/downloads/without-skill.pptx) · [完整记录](https://lamongl.github.io/-/downloads/comparison.md)

匿名评审认为新版在答辩可用性上有小幅优势，尤其是证据组织和问答针对性。两组都满足硬性要求，视觉差距不大。单次墙钟耗时约5分34秒和9分31秒，包含工具恢复与返工，不代表稳定速度提升；后续已核查实际Token记录，本轮不支持节省结论，不宣传节省比例。

## 本地开发

```text
npm ci
npm test
npm start
```

`npm run build` 生成 `site-dist/`，GitHub Actions 将其发布到原 Pages 根网址。`npm run start:bridge` 启动 stdio MCP（由宿主调用，不是独立AI服务）。`python scripts/package-delivery-skill.py` 生成白名单安装包。

源代码包含早期版本以保留历史，新首页已替换原来的提示词复制页面。许可证：MIT。
