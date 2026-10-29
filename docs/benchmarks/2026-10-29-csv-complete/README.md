# 突破方向：复用本地计算，减少临时编程返工

日期：2026-10-29。组件实验，尚不是完整已安装Skill的端到端优势证明。

## 固定任务和质量验收

同一份736条合成流水，混合元/万元单位，按2026年8月和9月计算毛额、退款、净额、净额差、环比，披露排除行数、来源SHA256及同比/原因缺口，给主管写摘要。两组使用相同请求模型 `gpt-6.1-terra`、medium、Python、自动审批与工作区沙箱；第二轮倒转执行顺序。

在调用模型前生成整数分单位的独立答案表。17项验收包括8项月度数值、总行数、排除行数、SHA256、净额差、环比、同比null、两个资料缺口和摘要存在/长度。金额与比率用精确数值比较，不用模型自评分。随后逐份读取报告核对摘要是否与数据一致。

**两组各2/2通过17项验收，未测得成果质量提高；可比较这批明确要求均合格时的消耗。** 这不等于独立盲评的整体质量相同，尚未评价审美、复杂解释或真实业务价值。

## 全部结果（含失败后重试）

| 指标 | 通用模型＋本地计算工具 | 指定可复用计算工具 |
|---|---:|---:|
| 合计输入token（含缓存） | 84,290 | 66,623 |
| 合计输出token（含代码生成等） | 2,037 | 943 |
| 合计总token | 86,327 | 67,566 |
| 合计墙钟时间/秒 | 57.45 | 41.57 |
| 工具调用次数 | 3 | 2 |
| 其中失败调用 | 1 | 0 |
| 数值与要求验收 | 两次均17/17 | 两次均17/17 |

观测合计：总token少21.73%，墙钟时间少27.64%。输入已包含缓存，不再累加缓存或推理子项；订阅额度不换算为费用。

| 重复 | 通用模型总token | 可复用工具总token | 观测减少 |
|---|---:|---:|---:|
| 第1次 | 33,996 | 33,813 | 0.54% |
| 第2次 | 52,331 | 33,753 | 35.50% |

第二次通用模型写临时Python时出现 `SyntaxError: unterminated string literal`，自行修正后才合格。失败与返工按“到首次合格交付的总消耗”计入，不删掉这一轮；也不能用它宣称以后普遍节省21.73%。第一轮双方均一次成功时只省0.54%。时间包含启动、网络及推理，缓存状态不同，两个样本不足以做稳定时间或因果结论。

## 为什么这条路线值得保留

原始表格29,009字节，但通用模型本身也会在本地聚合，并未把全表读进模型。因此不能拿“29KB变几百字节”当作真实token节省证据。

本次差别是：通用模型每次临时生成计算程序；路线组调用已经测试过的确定性程序，一次返回金额、行数、差额、环比和来源指纹。模型仍负责遵守请求和写摘要。该程序的8项单元测试还覆盖缺失值、重复ID、混合单位、精确小数、缺月、零/负基期等边界。

## 负面结果与环境失败也保留

- 2026-10-28只读嵌套调用被策略拦截，不计为产品质量对比；随后自动审批预检通过。
- 2026-10-28通用组成功，但路线组工具成功后触发账号额度上限，未交付报告；这一对不能比较节省或质量。记录没有被当作路线组的低耗时成功。
- 2026-10-29的首个有效版本只汇总金额、不计算环比。两组都合格，路线组却因第二次工具调用消耗更多：通用组68,325 token，路线组101,748 token。这一失败方向完整保留于相邻 `2026-10-29-csv-route`。
- 发现多余调用后，只做一轮有明确原因的修正：加入可选比较与compact参数，保留全部必要事实，再固定做本页两次对照。没有继续追加测试挑选更高收益。

## 复现与范围

[`results.json`](results.json)是实际usage与逐项验收，[`summary.json`](summary.json)是合计；4份 `.answer.md` 是完整交付，[`oracle.json`](oracle.json)是独立生成的期望值。脚本 `scripts/benchmark-csv-route.py` 可重建相同736行合成材料，SHA256固定；使用 `--complete-route` 选择本版。旧版源码另有冻结快照。

运行：`python scripts/benchmark-csv-route.py --model gpt-6.1-terra --complete-route --output 新的空目录`。需要已登录Codex，将消耗其额度。程序适用UTF-8 CSV、明确月份/列角色、元或万元、毛额减退款口径；不支持任意文件、逐行备注分析或未定义口径。

**当前只证明了这次组件实验中的观测收益。** 指定脚本命令已作为路线指令给模型，完整Skill的发现、加载、参考文件、意图路由和部署成本尚未包含。公开安装版不因此升级为“已提效版”，也不把上述百分比用于产品宣传。

下一步应验证：完整Skill实际调用是否仍保留收益，以及不同数据结构、错误输入和重复使用场景的失败/返工率。继续测试之前先固定预算和验收，避免用测试本身无节制消耗额度。

方法方向参考 [Anthropic关于代码执行与上下文搬运的工程说明](https://www.anthropic.com/research/code-execution-with-mcp)和 [OpenAI延迟优化指南](https://developers.openai.com/api/docs/guides/latency-optimization)。这些来源只支持为何值得尝试本地处理，不是本项目的效果证据；上面的数字全部来自本次实际日志。

## English summary

A reusable local calculator is a promising component, not a proven whole-Skill improvement. Both conditions passed all 17 checks twice. Aggregate reported tokens were 86,327 versus 67,566 (21.73% lower); wall time was 57.45s versus 41.57s. The first pair saved only 0.54%; the second benefited from avoiding a temporary-code quoting error and retry. Small sample size, cache differences and unmeasured Skill-loading overhead limit the conclusion. Earlier negative and interrupted trials are retained.
