"""Summarize provider-reported usage without double-counting cache/reasoning."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/"docs/benchmarks/2026-10-28-pilot"
data=json.loads((RUN/"results.json").read_text(encoding="utf-8"))
rows=[]
totals={mode:{"seconds":0,"input":0,"output":0,"cached":0} for mode in ["baseline","skill"]}
for task in ["sales","notice","slides"]:
    pair={run["mode"]:run for run in data["runs"] if run["task"]==task}
    assert set(pair)=={"baseline","skill"}
    for mode,run in pair.items():
        assert run["status"]=="completed" and run["usage"] is not None
        usage=run["usage"]
        totals[mode]["seconds"]+=run["elapsed_seconds"]
        totals[mode]["input"]+=usage["input_tokens"]
        totals[mode]["output"]+=usage["output_tokens"]
        totals[mode]["cached"]+=usage["cached_input_tokens"]
    baseline,skill=pair["baseline"],pair["skill"]
    token_count=lambda run:run["usage"]["input_tokens"]+run["usage"]["output_tokens"]
    rows.append(f'| {dict(sales="销售月报",notice="维护通知",slides="PPT提示词")[task]} | {baseline["elapsed_seconds"]:.2f} | {skill["elapsed_seconds"]:.2f} | {token_count(baseline):,} | {token_count(skill):,} |')
b,s=totals["baseline"],totals["skill"]
total_b,total_s=b["input"]+b["output"],s["input"]+s["output"]
token_increase=(total_s/total_b-1)*100
output_saving=(1-s["output"]/b["output"])*100
time_increase=(s["seconds"]/b["seconds"]-1)*100
report=f'''# 有无 Skill 的初步对照测试

2026-10-28，3个合成任务，每种方式每任务1次，共6次独立CLI会话。指定模型 `{data["model_requested"]}`，推理设置 medium。不是统计显著性试验。

**结果：本轮没有测得总体提效或总token节省。总token增加 {token_increase:.1f}%，合计耗时增加 {time_increase:.1f}%。最终输出token减少 {output_saving:.1f}%，但不能用输出减少宣传总消耗减少。**

| 任务 | 不用Skill耗时/秒 | 使用Skill耗时/秒 | 不用Skill总token | 使用Skill总token |
|---|---:|---:|---:|---:|
{chr(10).join(rows)}
| 合计 | {b["seconds"]:.2f} | {s["seconds"]:.2f} | {total_b:,} | {total_s:,} |

| Token组成 | 不用Skill | 使用Skill |
|---|---:|---:|
| 输入（包含缓存输入） | {b["input"]:,} | {s["input"]:,} |
| 其中缓存输入（不重复加总） | {b["cached"]:,} | {s["cached"]:,} |
| 输出 | {b["output"]:,} | {s["output"]:,} |

## 成果检查

- 销售月报：两组均保留100元、120元，算出增加20元、环比20%，没有编造同比；Skill组另明确提示增长原因待核实。两组均未造增长原因。
- 维护通知：两组均保留10月30日22:00—23:00、禁止登录、提前保存，无新增年份或联系人。
- PPT提示词：两组均保留6页、零基础受众、三类场景、演讲备注及不编造统计要求；Skill组额外说明目标AI没有文件工具时应交付逐页内容并报告能力限制，输出更短。未实际生成PPT，不能据此评价成品质量。
- 本轮没有发起追问。输入完整且共同测试指令要求直接交付，因此这不能证明Skill减少追问次数。

## 测量方法和限制

1. 使用本机ChatGPT登录的Codex CLI，版本 `{data["cli"]}`。不使用付费API；消耗已有Codex额度，不能把token差直接写成节省金额。
2. 两组使用同一完整任务、相同公共约束、新会话、只读模式且忽略用户config；不加载当前聊天历史。Skill组附入安装包3份指令文件全文；基线明确不用Skill。两组可能收到相同的内置技能目录元数据，不能称为完全无技能系统基线。两组没有实际工具调用。
3. 每对交替先后顺序；各只一次，不消除缓存、网络和服务负载差异。耗时为启动、联网与推理总墙钟时间，未测人类操作时长，也未设置信心区间。
4. 总token = CLI报告input_tokens + output_tokens；cached_input_tokens已包含在输入中，reasoning_output_tokens不再叠加。只使用返回usage，不用字数估算token。本轮返回的reasoning_output_tokens均为0，不能据此断言模型真实内部处理为零。
5. 最终文本模式不能核验模型是否真正完成11候选及评审；本轮结果只能说明按这些指令运行的最终交付表现。不能宣传11候选全过程已强制验收。
6. Skill指令本身增加输入；简单完整任务容易出现两组都完成而Skill更耗token。不得只挑PPT输出减少作为总体节省证据。

## 复现与原始记录

使用 `scripts/benchmark-skill.py --model gpt-6.1-terra --output 新的空目录`（前置 `python`），再运行 `python scripts/summarize-benchmark.py` 汇总本次固定路径记录。运行将消耗宿主额度。后续正式试验应预先固定任务集、重复次数、质量验收和用户补充脚本，再评估包含返工的总成本。

[实际usage与配置](2026-10-28-pilot/results.json)。同目录保留6份输入与最终输出供核对；本地保留原始JSONL与stderr，公开仅发布合成任务输入、最终输出和usage，避免夹带宿主会话标识。

当前应宣传可验证的工作流和安装入口，暂不宣传“效率提高X%”或“总token节省X%”。
'''
(ROOT/"docs/benchmarks/README.md").write_text(report,encoding="utf-8")
print(json.dumps({"baseline_tokens":total_b,"skill_tokens":total_s,"token_increase_percent":round(token_increase,1),"output_saving_percent":round(output_saving,1),"elapsed_increase_percent":round(time_increase,1)},ensure_ascii=False))
