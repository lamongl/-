# 成品工作台 · Deliver Workbench

**把材料交给当前 AI，通过必要追问直接拿到成品。**

[打开产品首页](https://lamongl.github.io/-/) · [直接下载 Skill v1.3.0](https://lamongl.github.io/-/downloads/deliver-workbench-v1.3.0.zip) · [安装说明](skills/deliver-workbench/INSTALL.md) · [真实工作台界面](https://lamongl.github.io/-/#workbench) · [真实成果与对照记录](https://lamongl.github.io/-/#results) · [English](README.en.md)

成品工作台是一个开源 Skill 与本地 MCP 连接器。用户在界面提交材料和需求，当前宿主 AI 读取材料、分轮澄清、组织内容，使用已有工具制作并检查实际文件，最终在工作台下载。无需手动复制中间提示词。

网页是产品介绍、成果展示和安装入口；安装后的本地工作台才连接当前 AI。Codex、腾讯 WorkBuddy、豆包与 DeepSeek 的 Agent 环境均已完成开发者实测（兼容性测试情况由用户确认），具体安装方式与功能取决于对应工具版本。模型和额度由宿主提供，本项目不提供免费算力或跨平台登录授权。

## 安装：一个包交给 Agent

下载通用ZIP，不需要选平台。将整个包发给能读写文件、执行命令的Agent，告诉它：

```text
请读取压缩包里的 INSTALL.md，帮我在你当前使用的工具中安装成品工作台。
```

Agent会识别当前工具，安装依赖、Skill和本地连接器，并执行自检。需要刷新连接或新开会话时，会给出最后一步。安装后说“使用成品工作台，我要上传材料并直接拿到成品”。

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
