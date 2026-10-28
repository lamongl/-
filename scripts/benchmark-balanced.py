"""Contemporaneous baseline / legacy / lean text comparison, two runs per task."""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess, time
from benchmark_skill_loader import COMMON, TASKS

ROOT=Path(__file__).resolve().parents[1]

def run(model, output):
    executable=shutil.which('codex')
    if not executable: raise RuntimeError('Codex CLI missing')
    output.mkdir(parents=True,exist_ok=False)
    work=output/'work';work.mkdir()
    legacy='\n\n'.join((ROOT/'docs/benchmarks/v0.1.0-reference'/name).read_text(encoding='utf-8') for name in ['SKILL.md','evaluation.md','deliverables.md'])
    lean=(ROOT/'docs/benchmarks/2026-10-28-balanced/SKILL.lean.md').read_text(encoding='utf-8-sig')
    variants={'baseline':'本次不使用Skill，按一般助手方式完成。\n','legacy':'请遵循以下Skill与参考规则：\n'+legacy+'\n\n','lean':'请遵循以下Skill；本次完整文本任务无需额外参考文件：\n'+lean+'\n\n'}
    manifest={'model_requested':model,'effort':'medium','repeats_per_task':2,'task_count':3,'variant_hashes':{name:hashlib.sha256(text.encode()).hexdigest() for name,text in variants.items()},'measurement':'CLI reported input/output including cache in input; wall time includes startup and network','runs':[]}
    for repeat in range(2):
        for task_index,(name,task) in enumerate(TASKS):
            order=['baseline','legacy','lean'];offset=(task_index+repeat)%3;order=order[offset:]+order[:offset]
            if repeat: order.reverse()
            for mode in order:
                prompt=COMMON+variants[mode]+'用户任务：\n'+task
                stem=output/(name+'-'+mode+'-'+str(repeat+1))
                stem.with_suffix('.prompt.txt').write_text(prompt,encoding='utf-8')
                command=[executable,'exec','--json','--ephemeral','--skip-git-repo-check','--ignore-user-config','-s','read-only','-m',model,'-c','model_reasoning_effort="medium"','-C',str(work),'-']
                started=time.perf_counter();print('Starting '+stem.name,flush=True)
                process=subprocess.run(command,input=prompt,capture_output=True,text=True,encoding='utf-8',timeout=180)
                elapsed=round(time.perf_counter()-started,2)
                stem.with_suffix('.jsonl').write_text(process.stdout,encoding='utf-8')
                stem.with_suffix('.stderr.txt').write_text(process.stderr,encoding='utf-8')
                events=[]
                for line in process.stdout.splitlines():
                    try: events.append(json.loads(line))
                    except json.JSONDecodeError: pass
                completed=[event for event in events if event.get('type')=='turn.completed']
                messages=[event['item'].get('text','') for event in events if event.get('type')=='item.completed' and event.get('item',{}).get('type')=='agent_message']
                tools=[event['item'].get('type') for event in events if event.get('type')=='item.completed' and event.get('item',{}).get('type') not in ['agent_message','reasoning']]
                stem.with_suffix('.answer.md').write_text('\n\n'.join(messages),encoding='utf-8')
                record={'task':name,'mode':mode,'repeat':repeat+1,'elapsed_seconds':elapsed,'usage':completed[-1].get('usage') if completed else None,'tool_item_types':tools,'answer_file':stem.name+'.answer.md','status':'completed' if process.returncode==0 and completed else 'failed'}
                manifest['runs'].append(record)
                (output/'results.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
                print(json.dumps(record,ensure_ascii=False),flush=True)
                if record['status']!='completed': raise RuntimeError('Failed run; stop and inspect before retry')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--model',required=True);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();run(args.model,args.output.resolve())
