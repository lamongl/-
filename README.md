# 成品工作台 · Deliver Workbench

**把材料交给当前 AI，通过必要追问直接拿到成品。**

[打开产品首页](https://lamongl.github.io/-/) · [直接下载 Skill v1.1.0](https://lamongl.github.io/-/downloads/delivery-workbench-codex-v1.1.0.zip) · [安装说明](skills/deliver-workbench/references/setup.md) · [真实成果与对照记录](https://lamongl.github.io/-/#results) · [English](README.en.md)

成品工作台是一个开源 Skill 与本地 MCP 连接器。用户在界面提交材料和需求，当前宿主 AI 读取材料、分轮澄清、组织内容，使用已有工具制作并检查实际文件，最终在工作台下载。无需手动复制中间提示词。

网页是产品介绍、成果展示和安装入口；安装后的本地工作台才连接当前 AI。首个完整验证宿主是 Codex 桌面端。模型和额度由宿主提供，本项目不提供免费算力或跨平台登录授权。

## 安装

需要 Node.js 22.13+，以及可使用 stdio MCP、本地文件和目标格式制作工具的 AI 宿主。

1. [下载 ZIP](https://lamongl.github.io/-/downloads/delivery-workbench-codex-v1.1.0.zip)，将解压后的 `deliver-workbench` 放入 `~/.codex/skills/`。
2. 在该目录运行 `npm ci`。
3. 用本机真实绝对路径配置：

```text
codex mcp add delivery_workbench -- <Node绝对路径> <解压目录/bridge/server.mjs绝对路径>
```

刷新 MCP 连接或新开会话，确认 7 个工作台工具可用，再说：

```text
使用 $deliver-workbench 打开成品工作台，我要上传材料并直接拿到成品。
```

[完整接入说明](skills/deliver-workbench/references/setup.md) · [功能与边界](docs/delivery-workbench.md)

## 支持范围

- 最多5份，每份20MB；DOCX、XLSX、XLS、PPTX、文字型PDF、TXT、MD、CSV。
- 先读材料再分轮追问；完整需求不重复问；制作前组织主线和证据，交付前检查实际文件。
- 扫描PDF需先识别文字，旧DOC/PPT需转换。成品格式由宿主工具决定。
- 材料保存在本机，当前云端AI仍可能接收材料。保持AI对话运行；提交不能保证自动唤醒已结束的会话。

## 对照成果

同一论文、同一继承模型及底层工具，统一8页、5分钟、英文页面、中文讲稿和8组问答。两组独立制作，再匿名评审。

[使用Skill的PPT](https://lamongl.github.io/-/downloads/with-skill.pptx) · [未使用工作台Skill的PPT](https://lamongl.github.io/-/downloads/without-skill.pptx) · [完整记录](https://lamongl.github.io/-/downloads/comparison.md)

匿名评审认为新版在答辩可用性上有小幅优势，尤其是证据组织和问答针对性。两组都满足硬性要求，视觉差距不大。单次墙钟耗时约5分34秒和9分31秒，包含工具恢复与返工，不代表稳定速度提升；Token未统计，不宣称节省比例。

## 本地开发

```text
npm ci
npm test
npm start
```

`npm run build` 生成 `site-dist/`，GitHub Actions 将其发布到原 Pages 根网址。`npm run start:bridge` 启动 stdio MCP（由宿主调用，不是独立AI服务）。`python scripts/package-delivery-skill.py` 生成白名单安装包。

源代码包含早期版本以保留历史，新首页已替换原来的提示词复制页面。许可证：MIT。
