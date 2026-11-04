# 宿主接入与平台适配

## MCP 是首选接入方式

先完成 [INSTALL.md](../INSTALL.md) 的服务安装和宿主 MCP 验收。服务端自检与宿主工具加载分别报告。当前宿主没有真实配置入口时，重启不是已确认的解决方案。

调用后，MCP 的 `create_job` 会请求打开独立窗口。用户在界面提交资料并回答问题，Agent 通过七个工具读取状态、材料并交付。整个任务由一个服务进程管理。

使用宿主自带 Node 时记录 `process.execPath`。例如豆包内置 Node 的实际路径由本机环境决定，升级后可能变化。重新解析路径、更新 MCP 命令并自检。

## DeepSeek Harness

用户提供的 Windows 11 / DSH Web 0.2.1-rc.2 安装报告记录了七个工具实调、界面追问及 PDF 交付；这是该环境的记录，不代表普通 DeepSeek 网页支持本地 MCP。当前配置以宿主实际版本和官方说明为准。

先确定实际 DSH_HOME、当前 profile、Node 和安装目录。有插件管理入口时使用其官方安装流程；未暴露管理工具时，可以按官方 Loader 语法合并到 `$DSH_HOME/profiles/<当前profile>/cordis.patch.yml`。先备份，只增加本服务一项；同一 id/serverName 已存在时更新该项，不重复追加，不覆盖其他插件，也不默认写影响所有 profile 的全局 patch。

下面路径为示例，必须替换为本机真实绝对路径。YAML 单引号保留 Windows 反斜杠。

```yaml
- insert:
    - id: delivery-workbench-mcp
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: delivery_workbench
        transport: stdio
        command: 'D:\dsh\nodejs\node.exe'
        args:
          - 'D:\dsh\home\skills\deliver-workbench\bridge\server.mjs'
        cwd: 'D:\dsh\home\skills\deliver-workbench'
        toolCallTimeoutMs: 60000
```

保存后检查宿主是否热重载，确认 `mcp__delivery_workbench__*` 七个工具，再实际调用 create_job/get_job 验收；不能把“工具名出现”当成功。未刷新时按该版本的连接刷新流程处理，不盲目重启整个宿主。回滚时恢复该文件备份或仅移除本项；卸载前保留用户任务数据。

官方参考：[MCP 客户端字段](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md)、[profile patch 合并方式](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/mcp-memory.md)。

### 减少反复输入“继续”

25秒是一次等待的上限，可以接续调用。当前轮仍运行且宿主允许时，每个上传/答题节点按实际时钟最多等待约3分钟；收到提交立即继续，超时不重复创建任务。等待结果新增 waiting_for_user、next_action 和 continuation_hint，MCP 与 CLI 一致。只有总等待预算用尽、用户取消或宿主限制时才结束回合。工具返回不能保证唤醒已结束的模型会话；未验证宿主事件接口时，恢复仍需要回原聊天发送一次“继续工作台任务”。

### 文件制作与转换

连接器依赖负责读取资料，成品生成使用宿主已有工具。确需额外库时用独立临时制作目录安装，不改连接器的 package.json / 锁文件。先检查宿主内置文档或转换能力。

若 LibreOffice Kit 返回 EEXIST，优先转换到当前任务 output 下新的版本文件名；保留上一版，核对新文件再发布。不默认删除已有成品，也不向用户交付仅改后缀的文件。

## 用户选择后的 CLI 备用方式

适用于当前宿主尚未接入本地 stdio MCP、但支持本地文件和命令的场景。需要用户明确选择此方式。先完成依赖安装与自检，在工作台目录运行以下命令。`node` 应替换为当前环境真实可用的 Node 命令。

```text
node bridge/cli.mjs start
node bridge/cli.mjs create_job --input job.json
```

`job.json` 是 Agent 写入的 UTF-8 JSON 参数文件，例如下列内容。命令输出为 JSON，包含真实的任务地址、访问凭证和输出目录。保留任务 ID，后续命令沿用它。

```json
{"title":"论文摘要","request":"做一个论文摘要","outputKind":"auto"}
```

之后每次调用均使用 `node bridge/cli.mjs <操作名> --input <参数文件>`。写参数文件可避免中文、引号和长文本在 shell 中被错误转义。

| 操作 | 参数文件中的字段 |
|---|---|
| `get_job` | `job_id` |
| `wait_for_submission` | `job_id`，可选 `timeout_ms`，最多25000 |
| `read_material` | `job_id`、`file_index`，可选 `offset`、`length` |
| `ask_questions` | `job_id`、`questions`，每轮1至3题 |
| `set_progress` | `job_id`、`status`，可选 `message` |
| `publish_result` | `job_id`、`paths`，可选 `message` |

追问参数示例，用户选择或填写后通过界面提交，Agent 再用等待命令获取回答。

```json
{
  "job_id":"使用create_job返回的实际ID",
  "questions":[
    {"id":"purpose","title":"这份摘要主要用于哪里？","options":["论文正文","答辩汇报","快速阅读"]},
    {"id":"format","title":"希望收到什么格式？","options":["中文Word","英文Word","中文Markdown"]}
  ]
}
```

CLI 与 MCP 共用 `actions.mjs` 和 `core.mjs`，包括至少一轮界面追问、输出目录检查和真实文件下载。制作由宿主 AI 完成。

## 服务生命周期

CLI 默认使用工作台目录下 `.workbench/local`，其中 `jobs/` 保存任务，`session.json` 保存服务信息和本机控制凭证。与 MCP 的默认数据目录分开，避免两个进程缓存同一任务。一个任务始终使用创建它的接入方式。

`start` 会复用健康服务，多次命令不会每次创建新后台。CLI 请求直接修改该进程内的任务状态。用户上传、追问和下载界面可持续轮询。临时 shell 结束后，后台服务继续运行。

```text
node bridge/cli.mjs status
node bridge/cli.mjs stop
node bridge/cli.mjs start
```

主动停止前应确认当前没有上传或制作。重启会复用记录中的端口和任务数据，原链接可以刷新继续访问。端口被其他程序占用时报告启动失败，检查本地 `service.log`。关闭服务期间界面无法访问。不能通过编辑 `job.json` 发布成品，也不要混用自行编写的临时服务。

可设置 `WORKBENCH_LOCAL_DIR` 为独立持久目录。服务只监听 `127.0.0.1`，控制接口使用独立凭证并拒绝浏览器跨站请求。凭证只用于当前本机任务，不能放进开源仓库或公开日志。

普通网页聊天若无本地文件和命令能力，需要先使用支持这些能力的 Agent 环境。官方平台资料只作为配置入口参考，安装报告中应区分实际验证的宿主能力。

资料来源与文档

- [豆包开放平台](https://open.doubao.com/) 将 Skill、MCP 和 CLI 列为接入能力，具体分发及配置方式以当前产品为准。
- [npm cache](https://docs.npmjs.com/cli/v11/commands/npm-cache/) 与 [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) 用于依赖缓存和锁文件安装。
