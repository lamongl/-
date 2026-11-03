# 连接器接入

Skill依赖本项目的本地连接器，不使用模型API或腾讯OAuth。首先需要本机Node.js 22.13+，在项目根目录运行 `npm ci`。

Codex使用当前官方支持的stdio MCP配置。命令中的Node和服务脚本应使用本机真实绝对路径：

```text
codex mcp add delivery_workbench -- <Node可执行文件的绝对路径> <项目根目录/bridge/server.mjs的绝对路径>
```

从源码安装时，将 `skills/deliver-workbench` 整个目录放入宿主支持的技能目录；使用发行ZIP时，将解压后包含 `SKILL.md` 的 `deliver-workbench` 目录放入技能目录，并在该目录运行 `npm ci`。源码的MCP脚本位于项目根目录，发行ZIP的脚本位于解压目录，两者都应使用实际 `bridge/server.mjs` 绝对路径配置。Codex可使用用户技能目录；刷新MCP连接或按宿主要求重启/新开会话，确认出现 `delivery_workbench` 的7个工具后再调用Skill。

其他支持stdio MCP及本地文件制作工具的宿主可以采用等价配置，但安装入口和文件工具不同，需要单独验证。仅支持普通网页聊天的AI不能靠这份SKILL.md自动打开并接管本机服务。

本机任务文件保存到项目 `.workbench/jobs`，不在GitHub发布白名单。原始文件、提取文字、任务回答和成品会保留到用户主动清理；这些资料依然由当前AI宿主处理，不保证云端模型的数据仅留在本机。连接器只绑定127.0.0.1，每个任务使用独立访问凭证。

已经开启的旧会话如果还没有新MCP工具，可由开发者用 `node bridge/client-session.mjs` 建立真实stdio测试连接；该脚本将工具调用JSON传给同一连接器，不替代AI执行，也不调用外部模型。当前会话仍需按正常权限读取材料和制作文件。
