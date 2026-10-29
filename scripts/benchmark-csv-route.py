"""Bounded tool-enabled experiment: generic host vs targeted local aggregation route."""
from pathlib import Path
import argparse, csv, hashlib, io, json, random, shutil, subprocess, sys, time
from decimal import Decimal, ROUND_HALF_UP

ROOT=Path(__file__).resolve().parents[1]

def make_fixture(work):
    rows=[];oracle={}
    for month,base in [('2026-08',12000),('2026-09',14700)]:
        gross_sum=refund_sum=0
        for i in range(360):
            gross=base+(i*37)%9999;refund=(i*29)%1900
            if i%71==0:gross=refund=0
            gross_sum+=gross;refund_sum+=refund
            multiplier=1000000 if i%3==0 else 100
            rows.append([month+'-'+str(i),month,str(Decimal(gross)/multiplier),str(Decimal(refund)/multiplier),'万元' if multiplier==1000000 else '元'])
        oracle[month]={'rows':360,'gross_yuan':str(Decimal(gross_sum)/100),'refund_yuan':str(Decimal(refund_sum)/100),'net_yuan':str(Decimal(gross_sum-refund_sum)/100)}
    for i in range(16):rows.append(['outside-'+str(i),'2026-07','999','0','元'])
    random.Random(712).shuffle(rows)
    text=io.StringIO(newline='');writer=csv.writer(text);writer.writerow(['id','month','gross','refund','unit']);writer.writerows(rows)
    file=work/'sales.csv';file.write_text(text.getvalue(),encoding='utf-8-sig',newline='')
    change=Decimal(oracle['2026-09']['net_yuan'])-Decimal(oracle['2026-08']['net_yuan'])
    rate=change/Decimal(oracle['2026-08']['net_yuan'])*100
    return {'months':oracle,'total_rows':736,'excluded_rows':16,'net_change_yuan':str(change),'net_change_pct':str(rate.quantize(Decimal('0.01'),rounding=ROUND_HALF_UP)),'source_sha256':hashlib.sha256(file.read_bytes()).hexdigest()}

def grade(text,oracle):
    cleaned=text.strip()
    if cleaned.startswith('```'):cleaned='\n'.join(cleaned.splitlines()[1:-1])
    try:answer=json.loads(cleaned)
    except (ValueError,TypeError):return {'passed':False,'failures':['not valid JSON']}
    if not isinstance(answer,dict):return {'passed':False,'failures':['not a JSON object']}
    months=answer.get('months')
    if not isinstance(months,dict):return {'passed':False,'failures':['months is missing or not an object']}
    checks={}
    for month,values in oracle['months'].items():
        for field,value in values.items():
            month_result=months.get(month)
            actual=month_result.get(field) if isinstance(month_result,dict) else None
            try:checks[month+'/'+field]=Decimal(str(actual))==Decimal(str(value))
            except Exception:checks[month+'/'+field]=False
    for field in ['total_rows','excluded_rows','source_sha256']:checks[field]=answer.get(field)==oracle[field]
    for field in ['net_change_yuan','net_change_pct']:
        try:checks[field]=Decimal(str(answer.get(field)))==Decimal(oracle[field])
        except Exception:checks[field]=False
    checks['yoy_null']='yoy_pct' in answer and answer['yoy_pct'] is None
    limits=str(answer.get('limitations',''))
    checks['prior_year_gap']='同期' in limits or '去年' in limits
    checks['cause_gap']='原因' in limits and any(word in limits for word in ['无法','不能','不足','未知','未提供','不明确','未说明','缺少'])
    checks['summary_present']=isinstance(answer.get('summary'),str) and 0<len(answer['summary'])<=180
    return {'passed':all(checks.values()),'checks':checks,'failures':[key for key,value in checks.items() if not value]}

def run(model,output,complete_route=False):
    executable=shutil.which('codex')
    if not executable:raise RuntimeError('Codex CLI missing')
    output.mkdir(parents=True,exist_ok=False);work=output/'work';work.mkdir()
    oracle=make_fixture(work);(output/'oracle.json').write_text(json.dumps(oracle,ensure_ascii=False,indent=2),encoding='utf-8')
    helper=ROOT/'experiments/csv-route/csv_sales_digest.py'
    helper_hash=hashlib.sha256(helper.read_bytes()).hexdigest()
    task=f'''根据当前工作目录的 sales.csv 为主管写2026年9月销售月报。列含义：id为唯一流水号；month为YYYY-MM；gross为毛销售额，refund为退款额，unit为该行两笔金额的单位（元或万元）。净销售额=毛销售额-退款额。只汇总2026-08和2026-09，说明排除的其他月份行数。不要按月份平均，不把无记录当零，不分析具体增长原因。核对每月行数及原文件SHA256，计算净额环比（百分数保留两位）。没有去年同期数据。
只输出一个JSON对象：months（按月份键包含rows、gross_yuan、refund_yuan、net_yuan），total_rows，excluded_rows，net_change_yuan，net_change_pct，source_sha256，yoy_pct（无法算时null），limitations（明确同比数据及原因缺口），summary（给主管的中文摘要，180字内）。金额统一元，小数字符串或数值均可。
两组均可用只读本地工具和同一Python：{sys.executable}。无需联网、不加载其他Skill、不读取工作目录以外资料来获取答案、不创建文件。请按需调用计算工具，不需要把全部明细搬入对话。'''
    route=f'''本次使用本地月汇总路线。可直接运行已测试的只读工具：& '{sys.executable}' '{helper}' --input sales.csv --months 2026-08 2026-09 --id-column id。工具仅给出精确按月金额、行数、来源指纹与范围；环比和文字仍需按任务完成。若工具报错，报告错误，不把部分结果冒充完整。只在工具无法支持任务时再读明细或编写额外代码。'''
    if complete_route:
        route=f'''本次使用本地月报事实工具，一次运行：& '{sys.executable}' '{helper}' --input sales.csv --months 2026-08 2026-09 --id-column id --compare 2026-08 2026-09 --compact。返回含任务所需的金额、行数、SHA256、净额差与环比；按JSON任务字段组织报告，文字不编造原因。仅工具报错或结果缺项时再检查，不重复计算已验证字段。'''
    manifest={'kind':'tool-enabled component experiment, not full installed-Skill superiority test','model_requested':model,'effort':'medium','repeats':2,'route_version':'complete' if complete_route else 'aggregate-only','helper_sha256':helper_hash,'file_bytes':(work/'sales.csv').stat().st_size,'plan':'two repeats; reverse order on repeat 2; same input, tools, Python, workspace sandbox and automatic approval; commands requested read-only; 17 predetermined content checks; no retries selected for a positive outcome','runs':[]}
    (output/'task.txt').write_text(task,encoding='utf-8');(output/'route.txt').write_text(route,encoding='utf-8')
    for repeat in range(2):
        for mode in (['baseline','route'] if repeat==0 else ['route','baseline']):
            prompt=task+('\n'+route if mode=='route' else '')
            stem=output/(mode+'-'+str(repeat+1));stem.with_suffix('.prompt.txt').write_text(prompt,encoding='utf-8')
            command=[executable,'exec','--json','--ephemeral','--skip-git-repo-check','--ignore-user-config','--approve-for-me','-m',model,'-c','model_reasoning_effort="medium"','-C',str(work),'-']
            print('Starting '+stem.name,flush=True);started=time.perf_counter()
            process=subprocess.run(command,input=prompt,text=True,capture_output=True,encoding='utf-8',timeout=240)
            elapsed=round(time.perf_counter()-started,2)
            stem.with_suffix('.jsonl').write_text(process.stdout,encoding='utf-8');stem.with_suffix('.stderr.txt').write_text(process.stderr,encoding='utf-8')
            events=[]
            for line in process.stdout.splitlines():
                try:events.append(json.loads(line))
                except json.JSONDecodeError:pass
            completed=[e for e in events if e.get('type')=='turn.completed']
            messages=[e['item'].get('text','') for e in events if e.get('type')=='item.completed' and e.get('item',{}).get('type')=='agent_message']
            text=messages[-1] if messages else '';stem.with_suffix('.answer.md').write_text(text,encoding='utf-8')
            tools=[e['item'] for e in events if e.get('type')=='item.completed' and e.get('item',{}).get('type')=='command_execution']
            errors=[e.get('message') or e.get('error',{}).get('message','') for e in events if e.get('type') in ['error','turn.failed']]
            status='completed' if process.returncode==0 and completed else 'failed'
            record={'mode':mode,'repeat':repeat+1,'elapsed_seconds':elapsed,'status':status,'failure_kind':('quota_limit' if any('usage limit' in error for error in errors) else 'infrastructure_or_provider_error') if status=='failed' else None,'usage':completed[-1].get('usage') if completed else None,'tool_calls':len(tools),'tool_exit_codes':[tool.get('exit_code') for tool in tools],'grade':grade(text,oracle) if status=='completed' else None,'answer_file':stem.name+'.answer.md'}
            manifest['runs'].append(record);(output/'results.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(record,ensure_ascii=False),flush=True)
            if record['status']!='completed':raise RuntimeError('Infrastructure failure: stop before running additional cases')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--model',required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--complete-route',action='store_true')
    args=parser.parse_args();run(args.model,args.output.resolve(),args.complete_route)
