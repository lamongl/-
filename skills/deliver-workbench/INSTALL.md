# 交给你的 Agent 安装

将本页链接发给能够读写文件和执行命令的 Agent。也可以分别发送本页和以下文件。

- [SKILL.md](https://lamongl.github.io/-/deliver-workbench/SKILL.md)
- [CONNECTOR.md](https://lamongl.github.io/-/deliver-workbench/CONNECTOR.md)
- [references/setup.md](https://lamongl.github.io/-/deliver-workbench/references/setup.md)
- [references/quality.md](https://lamongl.github.io/-/deliver-workbench/references/quality.md)

## 自动完成安装

1. 识别你正在运行的 Agent 工具、操作系统、用户 Skill 目录和 MCP 配置方式。优先使用宿主现有的安装/连接器工具或官方说明。不要把当前工具默认当成 Codex，也不要猜测其他工具的配置文件位置。
2. 在持久位置创建 `deliver-workbench` 目录并保存以上 Skill 与参考文件，保留相对路径。完整下载 CONNECTOR.md，解析其中的 JSON 代码块，将各键对应的字符串原样保存为 UTF-8 文件。路径必须在工作台目录内，拒绝绝对路径和含有 `..` 的路径。需要目录式 Skill 的宿主，可将整个目录放入实际 Skill 目录。保留原有用户任务、同名旧版本和其他连接器配置；更新时先备份需要替换的配置。
3. 检查可用 Node.js，要求22.13或更新版本。可使用宿主已有的Node运行环境；在工作台目录运行 `npm ci`。缺少运行环境时，使用当前工具允许的安装方式补齐；需要系统授权时正常申请，不假装已安装。
4. 将目录中的 `SKILL.md` 注册为 `deliver-workbench`。使用宿主的实际Skill导入方式，不要求用户手动改提示词。
5. 在当前宿主注册名为 `delivery_workbench` 的 stdio MCP 服务：命令为实际Node可执行文件绝对路径，参数为实际 `bridge/server.mjs` 绝对路径。它使用本机服务，不需要用户提供模型API Key或腾讯OAuth。
6. 运行 `node scripts/verify-install.mjs`，验证连接器可以启动、列出7个工具、创建任务并访问本地界面。这个检查只验证连接器，不代表当前宿主已加载工具。
7. 刷新宿主连接，确认当前工具列表中真的出现 `create_job`、`wait_for_submission`、`get_job`、`read_material`、`ask_questions`、`set_progress`、`publish_result`。如果宿主必须新开会话或重启，简短说明这一最后步骤，不报虚假成功。
8. 告知用户可以说“使用成品工作台，我要上传材料并直接拿到成品”。宿主支持 `$deliver-workbench` 时可使用该名称调用。真正开始任务时立即创建任务，连接器会尝试打开独立工作台窗口；启动失败则由宿主打开返回的真实链接。安装自检设置 `WORKBENCH_OPEN_WINDOW=0`，避免弹出临时测试窗口。

这是用户明确授权的安装任务。你应完成能自主完成的文件操作、依赖安装和配置，不把技术步骤原样转交用户；必要授权仍遵循当前工具规则。若当前Agent缺少Skill或stdio MCP能力，说明具体缺口，不把普通聊天窗口描述成已经完整安装。

## Codex 的已知配置方式

Codex可将整个目录放入用户Skill目录 `~/.codex/skills/deliver-workbench`，安装依赖后使用真实绝对路径：

```text
codex mcp add delivery_workbench -- <Node绝对路径> <工作台目录/bridge/server.mjs绝对路径>
```

腾讯 WorkBuddy、豆包和 DeepSeek 的 Agent 工具使用各自的 Skill/连接器安装入口；用户已确认开发者实测跑通，配置位置与能力随具体产品版本而异。读取当前工具提供的说明完成配置，不套用Codex的目录或命令。

## 安装包内容

`SKILL.md`、质量方法、本地连接器、上传/追问/下载界面、依赖锁文件和连接器自检脚本。没有附带模型、账户、API密钥或用户材料。文件由当前Agent的模型与工具处理。
