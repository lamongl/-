# 成品工作台安装

将本页交给有文件读写与命令执行能力的 Agent。优先把 MCP 安装并接入当前宿主。MCP 不可用时，自动沿用下面的 Markdown 还原、依赖安装和 CLI 备用接入，不要求用户另行选择一次。真实任务仍在工作台提交资料、追问和交付；宿主必须保持工具任务运行，在界面提交后直接接续，不需要额外输入“继续”。

## 先识别宿主

记录宿主产品、版本、操作系统、实际 Skill 导入入口和 MCP 配置入口。先查看宿主设置与当前官方说明。豆包安装记录中的“只支持已绑定的远程连接器”和“未找到 stdio 配置”尚不能推出重启后会加载工具。找不到入口时明确标记为待接入。

可以使用宿主自带的 Node.js 22.13+。记录实际 `process.execPath`，不要复制其他电脑的路径。豆包沙箱运行时路径可能随版本变化，更新后重新解析 Node 路径并运行自检。

## 还原 Markdown 中的完整文件

发行文件均通过以下 Markdown 提供。`bridge/*.mjs` 等源码嵌在 CONNECTOR.md 的 JSON 中，官网没有对应的独立源码下载地址。

- [SKILL.md](https://lamongl.github.io/-/deliver-workbench/SKILL.md)
- [CONNECTOR.md](https://lamongl.github.io/-/deliver-workbench/CONNECTOR.md)
- [references/setup.md](https://lamongl.github.io/-/deliver-workbench/references/setup.md)
- [references/quality.md](https://lamongl.github.io/-/deliver-workbench/references/quality.md)

用文件下载工具获取完整 CONNECTOR.md。Node 网络下载失败时，用宿主文件下载工具或 PowerShell 将上面五个 Markdown 保存到当前目录及 references 子目录，再运行脚本。聊天中的截断预览不能用于安装。下面的 Node 脚本可保存为 `restore.mjs`，在获准写入的位置执行。它会创建一个新目录，更新旧安装时由 Agent 备份原文件后迁移，保留用户的 `.workbench` 数据。

```js
import {mkdir,mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const base='https://lamongl.github.io/-/deliver-workbench/';
async function download(name){
  try{return await readFile(resolve(name),'utf8');}
  catch(error){if(error.code!=='ENOENT')throw error;}
  const response=await fetch(new URL(name,base));
  if(!response.ok)throw Error(name+' HTTP '+response.status);
  const text=await response.text();
  if(Buffer.byteLength(text)>4*1024*1024)throw Error('文件过大，请检查下载内容');
  return text;
}
const markdown=await download('CONNECTOR.md');
const block=markdown.match(/^(`{3,})json\r?\n([\s\S]*?)\r?\n\1\s*$/m);
if(!block)throw Error('未找到完整 JSON 代码块');
const files=JSON.parse(block[2]);
for(const name of ['SKILL.md','INSTALL.md','references/setup.md','references/quality.md']){
  files[name]=await download(name);
}
for(const [name,text] of Object.entries(files)){
  if(!/^[A-Za-z0-9_./-]+$/.test(name)||name.startsWith('/')||name.split('/').includes('..')||typeof text!=='string'){
    throw Error('无效的文件路径或内容');
  }
}
if(!files['bridge/server.mjs']||!files['package-lock.json'])throw Error('源码不完整');
const target=await mkdtemp(resolve('deliver-workbench-'));
for(const [name,text] of Object.entries(files)){
  const destination=join(target,...name.split('/'));
  await mkdir(resolve(destination,'..'),{recursive:true});
  await writeFile(destination,text,'utf8');
}
console.log(target);
```

## 安装依赖

Windows PowerShell 5.1 不一定有 `pwsh`，宿主 Node/npm 也可能不在 PATH。先定位真实可执行文件，用 `& '实际绝对路径/node.exe' --version` 检查。优先用同一 Node 执行随它附带的 `node_modules/npm/bin/npm-cli.js ci`，或显式运行 `npm.cmd`，避免被 npm.ps1 的执行策略拦截。需要 PATH 时只对本次进程临时追加，不修改系统 PATH 或全局执行策略。

若连版本检查都报 sandbox-local / windows-acl / temp grant 错误，应先按宿主官方诊断处理沙箱授权；这不是缺少工作台依赖。不能通过反复重装、擅自切换完全权限或批量修改 ACL 解决。报告具体错误与用户可选的宿主授权操作。

在还原后的工作台目录执行 `npm ci`。使用宿主可用的 npm 命令，必要时用实际 Node 路径执行 npm-cli.js。核对命令退出码。

出现 ECONNRESET 等网络错误时可以重试一次。需要镜像时，针对本次命令使用 `npm ci --registry=https://registry.npmmirror.com`，不修改全局配置。镜像属于第三方服务。

SheetJS 是锁文件指定的独立 URL，切换 registry 不会替换它的下载地址。若 npm 下载失败而 PowerShell 可下载，按以下步骤将文件放入本地缓存，保留原依赖与锁文件。

```powershell
$lock = Get-Content -LiteralPath package-lock.json -Raw | ConvertFrom-Json
$sheet = $lock.packages.'node_modules/xlsx'
Invoke-WebRequest -Uri $sheet.resolved -OutFile xlsx-0.20.3.tgz -ErrorAction Stop
node scripts/verify-tarball.mjs ./xlsx-0.20.3.tgz xlsx
if ($LASTEXITCODE -ne 0) { throw '依赖校验失败' }
npm cache add ./xlsx-0.20.3.tgz --cache .npm-cache
if ($LASTEXITCODE -ne 0) { throw '缓存写入失败' }
npm ci --cache .npm-cache --prefer-offline --registry=https://registry.npmmirror.com
if ($LASTEXITCODE -ne 0) { throw '依赖安装失败' }
```

本地文件校验值来自锁文件。持续失败时保留错误日志并报告具体缺口，先排查宿主网络和代理。一次下载失败不能用来确定具体 TLS 或 HTTP 协议原因。

## 优先接入并验收 MCP

1. 运行 `node scripts/verify-install.mjs`，检查 MCP 服务能启动并列出七个工具，以及本地界面可访问。这是服务端检查。
2. 在宿主实际支持的入口注册 `delivery_workbench`，stdio 命令为实际 Node 路径，参数为本目录 `bridge/server.mjs` 的绝对路径。Codex 可使用下方命令。豆包、WorkBuddy 等按当前版本的实际入口配置。
3. 按宿主要求刷新连接或新开会话，然后在宿主工具列表中确认七个工具，实际调用 `create_job`、`get_job` 验证能取得同一任务。测试任务沿用现有记录，不要求用户重复上传。
4. MCP 验收通过后注册或更新 Skill，并向用户报告完成。缺少宿主工具时报告“服务端已安装，宿主 MCP 待接入”，不要仅凭 Node、npm、自检或重启判断成功。

```text
codex mcp add delivery_workbench -- <Node绝对路径> <工作台目录/bridge/server.mjs绝对路径>
```

七个工具为 `create_job`、`get_job`、`wait_for_submission`、`read_material`、`ask_questions`、`set_progress`、`publish_result`。

DeepSeek Harness 的 profile patch 接入与 Windows 示例见 [setup.md](references/setup.md#deepseek-harness)。普通 DeepSeek 聊天网页不等于 Harness，不套用这一配置。

记录里的豆包连接器使用远程 MCP，这不证明本机 stdio 注册可用。遇到只允许远程服务地址的配置页时，需要核对该产品的本地服务支持范围。本地工作台网页地址也不是 MCP 服务地址。

## MCP 不可用时沿用原安装流程

找不到当前版本的本地 MCP 入口、只支持远程 MCP，或注册后实际工具仍不可用时，简短说明 MCP 尚未接入，自动使用 [命令行接入](references/setup.md) 中的原有本地安装流程。复用已还原文件与依赖，不重复下载、不改锁文件、不编造单独源码地址。禁止本地命令或不具备文件、命令和持续等待能力时报告缺口，不能伪装安装成功。已开始的任务不要跨 MCP/CLI 换服务或新建重复任务。

CLI 验收不依赖 MCP 注册：运行 `node bridge/cli.mjs start`，再实际创建任务并读取同一 job_id；用 `wait_for_submission --input <参数文件> --follow` 保持等待。用户在工作台提交后 Agent 应直接读取，再将问题放到该工作台，继续等待真实回答。验收必须覆盖“提交材料 → 界面追问 → 界面回答 → 接续制作”，中间不能要求用户回聊天框输入任何续接提示词。没有持续执行或事件唤醒能力的宿主，只能报告功能受限，不能报告免续接已验证。

报告实际通过的是“MCP 接入”还是“CLI 接入”，并单列持续等待是否在当前宿主验证；不能把本地集成测试等同于任意 AI 客户端验收。

后台服务由提供的 CLI 启动和复用。所有修改通过 CLI 操作完成。直接修改 job.json 会与服务内存不一致，也可能造成任务丢失；不要把它作为发布方法。

每个任务都需要在界面完成至少一轮追问，包括简单摘要。收到用户回答后才能请求制作和交付。
