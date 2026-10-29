# 成品内容质量对照：尚未证明整体质量提升

2026-10-29。测试已发布v0.1.0完整指令，与不使用Skill的同模型对照；不是精简候选或CSV工具的新版本。四类合成任务，每组每任务一次，共8份成果。每次启动起60秒上限，全部按时完成，不追加重试挑结果。

## 质量发现

| 任务 | 两组共同满足 | 观察到的差异 |
|---|---|---|
| 月报 | 混合单位、净销售、环比7.83%、目标完成95.38%、分区贡献均正确；不编原因 | Skill版明确披露缺去年同期，基线没有披露，但也未编同比 |
| 通知 | 使用确认版时间、只影响报销系统、员工行动、预计恢复及延迟说明均正确 | 未发现可区分的事实/要求优势 |
| 演示内容 | 恰好6页、每页讲稿和≤3条要点、标注时长合计6分钟、案例及资料限制完整 | Skill版增加正确的20%和延期率分母例子；是否更适合新手待评 |
| 来源摘要 | 80/50/30/12口径、60%/40%分母、来源去重、主观10%不当实测均正确 | 未发现可区分的事实/要求优势 |

[作者逐项审查](author-review.md)保留32条预设核对项及两组证据。基线31条、Skill32条符合，差异只有同比缺口披露；这一核对项比原任务的明确措辞更强，不能据此把基线说成事实错误，不能把差额换算为产品质量提升百分比。

**尚未证明相同时间上限下，Skill成果整体更好。** 清晰程度、结构、可行动性和实际修改工作量尚无独立评阅；当前审查来自制作测试的同一助手，知道条件。独立分数留空，不用模型自评分补齐。

## 完整消耗记录

| 四个任务合计 | 不用Skill | 使用已发布Skill |
|---|---:|---:|
| 输入token（含缓存） | 65,090 | 73,854 |
| 输出token | 1,769 | 1,841 |
| 总token | 66,859 | 75,695 |
| 墙钟时间/秒 | 64.44 | 56.26 |
| 60秒内交付 | 4/4 | 4/4 |

本轮总token增加13.22%；观测墙钟合计少12.69%，不是稳定提速证明，也不等于质量更好。每个任务只运行一次，缓存状态不同，含启动/网络延迟。时间上限相同，实际完成时间不同。缓存已计入输入，不重复累加；推理子项不另外叠加。

## 原文和待评材料

| 任务 | 不用Skill | 使用Skill |
|---|---|---|
| 月报 | [全文](report-baseline.answer.md) | [全文](report-skill.answer.md) |
| 通知 | [全文](notice-baseline.answer.md) | [全文](notice-skill.answer.md) |
| 演示 | [全文](slides-baseline.answer.md) | [全文](slides-skill.answer.md) |
| 摘要 | [全文](sources-baseline.answer.md) | [全文](sources-skill.answer.md) |

[协议](protocol.md)、[任务和预设核对项](tasks.json)、[完整usage](results.json)、[可复算汇总](summary.json)、[冻结指令](SKILL.frozen.md)。`blind-review/`内为随机编号成果和评阅说明，仅把该目录交给评阅者，勿同时提供本页、组别映射或测量结果。编号映射另存在本地。成果措辞仍可能暗示条件，匿名不保证无法猜测。

独立评阅需要真实的、未参与制作的读者，最好两名，先各自记录事实问题、必须修改内容、清晰/结构/可行动性0—4锚定评价，再对比偏好并披露分歧。评阅完成前不填分数，不宣传质量优势。已有实际成果可直接开展这一步，不需要继续烧token生成更多评审意见。

[下载仅含匿名成果与评阅说明的ZIP](../../../release/quality-pilot-blind-review-2026-10-29.zip)。ZIP不含组别映射、消耗或作者结论；请单独交给评阅者。

## 范围和复现

材料全部内嵌，工具禁用。测的是完整信息下纯内容交付；未测真实联网检索、Word/PPTX排版、附件读取、模糊需求追问或内部11候选的执行合规。Skill规则以完整文本注入，包含全部三个参考文件输入；不是自动发现、按需加载的端到端产品安装测量。宿主公共Skill描述可能仍存在，两组无法彻底隔离模型已有知识。

先运行 `python scripts/benchmark-quality-pilot.py --prepare-only --output 新的准备目录` 核查四任务和冻结协议；正式 `python scripts/benchmark-quality-pilot.py --output 新的空目录` 将使用已登录Codex额度，固定8次调用。`python scripts/summarize-quality-pilot.py --directory 结果目录` 只重算，不调用模型。CLI版本实测0.163.0-alpha.10.2，模型请求gpt-6.1-terra、medium。

首次外层受限启动0.11秒即状态库/app-server访问被拒绝，未进入模型会话。该失败批次仍留本地，随后按协议补充说明以审批权限启动本批次；未替换任何模型结果。原始JSONL/stderr留本地，公开的都是合成材料和成果，不公开宿主会话标识。

## English

Eight delivered-content outputs were tested: four synthetic tasks, one run per condition, with the same requested model and a 60-second limit per run. Both conditions handled the central facts and calculations correctly. The Skill disclosed one additional missing-data limitation and added a correct teaching example; neither establishes an overall quality advantage. Independent usability review is pending; author review is explicitly identified.

Total reported tokens were 66,859 without the Skill and 75,695 with it (+13.22%). Aggregate wall time was 64.44s versus 56.26s; a single run per task and cache/network differences preclude stable performance claims. This is content-only, with injected released instructions, not a file-layout, live-search or complete installed-product evaluation. No overall quality-improvement percentage is claimed.
