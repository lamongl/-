"""Paired, fresh-session Codex text benchmark. No API key or paid API configured."""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess, time

ROOT = Path(__file__).resolve().parents[1]
TASKS = [
    ("sales", "给主管写一份简洁的9月销售月报：8月销售额100元，9月120元，比较变化，不编造增长原因。未提供去年同期数据。"),
    ("notice", "写内部通知：10月30日22:00至23:00系统维护，期间不可登录，请提前保存。简洁正式，不补造年份、负责人或联系方式。"),
    ("slides", "只输出一份可以直接交给其他AI执行的提示词：给零基础新员工做6页AI办公入门PPT，覆盖文档、报表、检索，通俗，每页附演讲备注。没有附件，不要虚构统计数据。"),
]
COMMON = "本次是合成资料的文本交付测试。只使用本条消息，不加载其他Skill，不调用工具或读取文件，不联网，不创建文件。需求已经完整，不再追问。直接输出要求的交付内容，不输出评审过程。不能确定的事实不得编造。\n"

def run_benchmark(model, output):
    executable = shutil.which("codex")
    if not executable:
        raise RuntimeError("Codex CLI not found")
    output.mkdir(parents=True, exist_ok=False)
    work = output / "work"
    work.mkdir()
    skill_dir = ROOT / "skills/prompt-workbench"
    files = ["SKILL.md", "references/evaluation.md", "references/deliverables.md"]
    skill = "\n\n".join((skill_dir / name).read_text(encoding="utf-8") for name in files)
    manifest = {"model_requested": model, "effort": "medium", "cli": subprocess.run([executable, "--version"], capture_output=True, text=True).stdout.strip(), "skill_sha256": hashlib.sha256(skill.encode()).hexdigest(), "repeats_per_task": 1, "measurement": "wall time includes CLI startup, network and inference; token usage is CLI-reported, not money", "limitations": ["one run per task and mode; exploratory only", "no human time measurement", "11 internal candidates not observable in final-output-only mode", "same skill catalog may be advertised to both modes; baseline explicitly told not to use skills"], "runs": []}
    for task_index, (name, task) in enumerate(TASKS):
        # Alternate order to reduce a simple first-run/order bias.
        modes = ["baseline", "skill"] if task_index % 2 == 0 else ["skill", "baseline"]
        for mode in modes:
            prompt = COMMON + ("请遵循以下Skill与参考规则：\n" + skill + "\n\n" if mode == "skill" else "本次不使用Skill，按一般助手方式完成。\n") + "用户任务：\n" + task
            stem = output / (name + "-" + mode)
            stem.with_suffix(".prompt.txt").write_text(prompt, encoding="utf-8")
            command = [executable, "exec", "--json", "--ephemeral", "--skip-git-repo-check", "--ignore-user-config", "-s", "read-only", "-m", model, "-c", 'model_reasoning_effort="medium"', "-C", str(work), "-"]
            started = time.perf_counter()
            print("Starting " + name + "/" + mode, flush=True)
            try:
                process = subprocess.run(command, input=prompt, capture_output=True, text=True, encoding="utf-8", timeout=180)
            except subprocess.TimeoutExpired as error:
                partial = error.stdout or b""
                stem.with_suffix(".jsonl").write_bytes(partial.encode() if isinstance(partial,str) else partial)
                manifest["runs"].append({"task": name, "mode": mode, "status": "timeout", "elapsed_seconds": round(time.perf_counter()-started,2)})
                (output / "results.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
                raise RuntimeError("Timed out; stop rather than silently running more samples")
            elapsed = round(time.perf_counter() - started, 2)
            stem.with_suffix(".jsonl").write_text(process.stdout, encoding="utf-8")
            stem.with_suffix(".stderr.txt").write_text(process.stderr, encoding="utf-8")
            events = []
            for line in process.stdout.splitlines():
                try: events.append(json.loads(line))
                except json.JSONDecodeError: pass
            completed = [event for event in events if event.get("type") == "turn.completed"]
            messages = [event["item"].get("text", "") for event in events if event.get("type") == "item.completed" and event.get("item", {}).get("type") == "agent_message"]
            tool_items = [event["item"].get("type") for event in events if event.get("type") == "item.completed" and event.get("item", {}).get("type") not in ["agent_message", "reasoning"]]
            final = "\n\n".join(messages)
            stem.with_suffix(".answer.md").write_text(final, encoding="utf-8")
            record = {"task":name,"mode":mode,"status":"completed" if process.returncode == 0 and completed else "failed","elapsed_seconds":elapsed,"usage":completed[-1].get("usage") if completed else None,"tool_item_types":tool_items,"answer_file":stem.name+".answer.md"}
            manifest["runs"].append(record)
            (output / "results.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
            print(json.dumps(record,ensure_ascii=False),flush=True)
            if record["status"] != "completed":
                raise RuntimeError("Inference failed; inspect logs before retrying")

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--model",required=True)
    parser.add_argument("--output",required=True,type=Path)
    args=parser.parse_args()
    run_benchmark(args.model,args.output.resolve())
