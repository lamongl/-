> 历史版本，已撤回。v0.6已移除密钥输入和模型调用，当前网页版只生成提示词。请以 [v0.6说明](web-v0.6.md) 为准。 Historical version: API integration removed in v0.6.

# 网页版 v0.5：用户自带火山方舟密钥

访问：https://lamongl.github.io/-/

## 使用

1. 展开“接入我自己的豆包模型”，通过官方链接登录自己的火山方舟账户并创建API Key；查看所选模型的权限、剩余额度及计费规则。
2. 在本站填写自己的Key及模型ID，默认示例为 `doubao-seed-2-1-lite-260915`，可改为自己的可用模型或接入点ID。示例不是可用权限或免费额度承诺。
3. 阅读并确认完整提示词、附件原文和资料链接将发送给火山方舟，以及由密钥所属账户承担费用。本站不充值、不代收款、不提供公共API Key或免费额度。
4. 整理任务后，明确选择“AI优化提示词”或“AI生成正文”。每次点击最多发起一个请求，不自动重试。AI文本与本地草稿分开显示，可复制或下载。

## 数据和计费边界

- 浏览器通过HTTPS直接请求官方端点 `https://ark.cn-beijing.volces.com/api/v3/chat/completions`。没有网站代理服务器；密钥仅放在Authorization请求头，不加入模型提示词。不携带cookie，不允许重定向；请求失败不换用第三方服务。
- 密钥输入为密码框，不写入本地存储、URL、日志、历史或数据库；离开页面时清空，用户可主动清除。网页运行时仍可访问输入的密钥，这不是操作系统密钥库；只应在信任的设备、浏览器及本网站版本中使用。
- 完整提示词和文本附件一并发给火山方舟，不能再把AI调用称为“资料只留本地”。语音仍使用v0.4的浏览器识别，不把方舟文本API Key当作已开通的独立ASR服务。
- 免费额度、实际费用、用量上限和账户欠费等均由火山方舟控制；本站不会因为本地未计费就保证API调用免费。可调输出长度上限不等于费用上限，输入token也可能计费。
- 原样展示服务返回的输入/输出/总token；缺少有效usage则标未知，不估算价格、不重复累加缓存或推理子项。
- 90秒未收到结果会停止等待，不自动重试。停止、网络失败或没有正文均不保证服务端没执行或没计费，须先核对提供方账单。
- 单次输入上限60,000字符（不是token），超限在本地拒绝，不自动丢弃资料。输出截断、审核限制和无正文均明确提示。

## 能力范围

优化模式只生成一份可执行提示词。正文模式仅使用内嵌文字，没有联网检索、链接读取、计算代码或Word/PPTX文件制作工具；不声称已执行这些操作。没有11候选或质量提高百分比承诺。免费本地模板功能保留，无需Key。

## 验证

2026-10-29：对官方端点发送无密钥、无模型调用的OPTIONS预检，返回200，允许来源 `https://lamongl.github.io`、POST及authorization/content-type头。该检查没有模型用量，但不保证鉴权后的所有响应始终携带相同CORS头。

19项Node测试通过，覆盖固定官方端点、密钥不进入提示词、无cookie和重定向、错误不回显提供方正文、无自动重试、超限前置拒绝、截断/usage/空正文及原有功能。浏览器核对未确认费用时拦截、无效格式Key本地拒绝、清空Key与结果、390px无横向溢出，控制台无警告/错误。

**没有使用真实用户Key完成鉴权或计费模型调用；成功正文、实际模型效果、每个账户的权限与额度尚待用户首次调用验证。** 测试中的成功模型响应使用替身，不当作真实API验收。上线后仍可能受网络、CORS、地区、模型权限、接口变化或账户余额影响。

依据：[官方Chat API](https://docs.volcengine.com/docs/ark/chat-api?lang=en)、[API Key管理](https://docs.volcengine.com/docs/ark/manage-api-keys?lang=zh)。模型输出限长不证明费用、质量或token优势。

## English

Users bring their own Volcengine API key. The browser sends one explicit request directly to the official endpoint; no site billing, shared keys, proxy, persistent key storage or automatic retries. Full prompt and attached text are sent to Volcengine only after consent and an explicit AI action. Usage and fees belong to the key owner's provider account. Local template building remains free.

Nineteen automated tests, browser guards and a credential-free CORS preflight passed. Real-key authentication and charged model calls have not been tested. The text model has no live-search, URL-fetching or file-generation tools. Browser dictation remains a separate capability.
