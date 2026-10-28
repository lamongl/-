# 精简版复测：没有证据证明质量优于不用 Skill

2026-10-28。三个合成文本任务，每种方式各做两次，共18次新CLI会话。模型请求为 `gpt-6.1-terra`，medium。测试顺序交替，使用相同任务和公共约束，记录实际usage及墙钟耗时。不调用工具，不联网，不生成办公文件。

**结论：三组均满足这批任务的明确要求，没有测得质量提升。精简版只减少了相对旧版的token消耗，仍未证明比直接使用宿主更高效。因此精简版保留为本地实验候选，不发布成提效版本。**

## 可复查的内容验收

| 任务及判定项 | 无Skill | 旧版全加载 | 精简入口 |
|---|---:|---:|---:|
| 月报：100元/120元原值；增加20元；环比20%；不编造同比或增长原因 | 2/2 | 2/2 | 2/2 |
| 通知：10月30日22:00—23:00；无法登录；提前保存；无捏造年份、负责人或联系方式 | 2/2 | 2/2 | 2/2 |
| PPT提示词：6页、零基础新员工、文档/报表/检索、每页演讲备注；不捏造统计或声称已生成PPT | 2/2 | 2/2 | 2/2 |
| 合计 | 6/6 | 6/6 | 6/6 |

这些判定项直接来自原任务。先用脚本检查关键约束出现，再逐份读取输出核对语义和是否捏造；仅关键词出现不等于质量通过。代码检查结果保留于 summary.json，最终输出也完整保留。

这说明在这批简单任务中没有出现可区分的硬性错误，合格率没有提高；不能把它写成“整体质量提高0%”，更不能写成“质量提高X%”。通顺、审美、决策价值、复杂材料准确性均未做独立盲评。人工阅读由同一作者助手进行，不是独立评委审查。

## 实际消耗

| 指标（每组6次合计） | 无Skill | 旧版全加载 | 精简入口 |
|---|---:|---:|---:|
| 输入token（含缓存） | 101,379 | 114,507 | 103,786 |
| 输出token | 1,043 | 736 | 960 |
| 总token | 102,422 | 115,243 | 104,746 |
| 墙钟时间/秒 | 69.56 | 63.49 | 75.13 |

本轮合计：精简版较旧版总token少9.11%，较无Skill多2.27%；墙钟耗时较旧版多18.33%、较无Skill多8.01%。这些是观测值，不是稳定性能提升或因果效应。较短的正文与token更少不是同一指标，也不能代替质量验收。

**重要干扰：**第二轮部分调用的输入较相同任务/模式第一轮多约4,947 token，尽管显式提示词相同。例如通知baseline由16,064变为21,011，旧版slides由18,273变为23,220。另一次notice精简入口有小幅输入差异。宿主隐藏输入、模型版本路由和缓存不是本测试可完全控制的因素。因此不能把这次总量差直接归因于改版。原始数字不删、不修正为理想值，不继续重复试验以挑选正面结果。

## 精简的设计改动（尚非效果证明）

- 入口只保留必要规则，简单完整请求不自动加载Skill。
- 显式调用简单任务一稿一次检查；实质取舍最多比较两个短方案。
- 11候选与评分仅在用户明确要求深度评审时执行；参考文件按需读取。
- 不删除必要事实、来源和交付要求，不因节省token而跳过必要核验。

## 复现与边界

[results.json](results.json) 为实际CLI usage，[summary.json](summary.json) 为可复算汇总。18份 `.answer.md` 是完整最终输出。`SKILL.lean.md` 为冻结的精简入口；旧版三文件保留在相邻 `v0.1.0-reference`。本地另保留逐次prompt、JSONL与stderr，未公开宿主会话标识。

可运行 `python scripts/benchmark-balanced.py --model gpt-6.1-terra --output 新的空目录`。随后修改汇总脚本的RUN目录或针对原固定目录运行 `python scripts/summarize-balanced.py`。将消耗现有Codex额度，不代表API费用。

缓存输入已包含在input_tokens，未二次加总；reasoning_output_tokens未另加到输出。没有量化用户操作时间、返工、真实文件或11候选执行合规。每场景两次不足以做稳定统计结论，且相同技能目录可能在三组被宿主提供。

下一步若继续验证，应预先固定能代表真实用户的复杂任务及失败条件，准备独立盲评和更多重复；在此之前，公开定位为实验指令包，不宣传效率或质量提升。

## English summary

No quality improvement over the host alone was demonstrated. All three conditions met the explicit requirements in 6/6 synthetic text outputs. This is an inspectable requirement check by the authoring assistant, not independent blinded quality scoring.

Lean instructions used 9.11% fewer total reported tokens than the legacy condition, but 2.27% more than baseline. Wall time was higher in this run. Hidden-input variation of roughly 4,947 tokens affected some calls, so aggregate differences cannot be attributed cleanly to the revision. The lean candidate is not released as a proven efficiency improvement.
