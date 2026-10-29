# 网页版 v0.3 / Web v0.3

公开地址：https://lamongl.github.io/-/

本版是本地规则提示词整理器，未接AI，没有账号、远程附件服务、历史数据库或遥测。公开Skill仍为v0.1.0；网页版本号与Skill版本独立。

## 用户可使用的功能

- 四种办公场景，保留需求与UTF-8文本资料；仅按本地规则补问关键信息。
- 可选格式、风格及至多5个已有资料链接，无需通过多轮问题填写偏好。
- 资料原文完整进入提示词，已有核心事实不能仅由链接替代；要求目标AI如实报告访问失败。
- 复制完整文本、下载TXT；设备支持Web Share时可主动调用系统文本分享。分享是否真正发送由接收应用决定，不自动发送或上传。
- 全文字符数、附件/链接数量及长文本提示。字符数不是实际token，未自动删减资料。
- 手机单栏布局、键盘焦点、错误提示与取消新建确认。需求和资料仅在页面内存中处理。

## 发布验证（2026-10-29）

- 9项Node测试通过；语法检查、静态构建通过。构建白名单为5个资源文件及.nojekyll，不发布测试材料或本机资料。
- 通过真实浏览器检查：格式/风格进入草稿，脚本协议链接被拒绝，合法链接保留，调整要求保留，复制成功，TXT下载并核对正文，附件原文完整进入草稿。
- 390px手机视口查看结果导出区域，320px查看输入布局并修正窄屏按钮/标题换行，均无横向溢出；桌面视口查看输入布局，测试期间控制台无警告或错误。新建确认后，需求与附件清空。
- 系统分享入口仅验证可见及能力检测，未向其他应用或他人实际发送。未在真实iOS/Android设备上验证系统分享，失败时可复制/下载。

## 部署

GitHub Actions的Pages工作流执行 `npm test`、`npm run build`，仅上传dist白名单。所有站内资源用相对地址，兼容 `/-/` 仓库子路径。无需密钥或新增后端。正式上线状态以Actions结果和线上版本为准。

Local development: `node web/server.mjs`; tests: `node --test web/core.test.mjs scripts/build.test.mjs`; build: `node scripts/build.mjs`. Alternatively use the npm scripts with Node 22+ and npm.

The browser app builds a complete prompt locally. It does not run an AI model, evaluate eleven candidates, fetch source links or host private attachments. Copy, TXT export and optional native text sharing are supported. Quality and efficiency gains are not established. File contents stay in page memory until the user explicitly exports or shares them; the hosting provider still receives ordinary site requests.
