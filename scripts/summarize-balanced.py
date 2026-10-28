"""Compute aggregate measurements and inspectable constraint checks."""
from pathlib import Path
import json, re, statistics

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'docs/benchmarks/2026-10-28-balanced'
data=json.loads((RUN/'results.json').read_text(encoding='utf-8'))
assert len(data['runs'])==18,'Incomplete trial'
totals={}
quality=[]
for mode in ['baseline','legacy','lean']:
    runs=[r for r in data['runs'] if r['mode']==mode]
    assert len(runs)==6 and all(r['status']=='completed' for r in runs)
    totals[mode]={'input':sum(r['usage']['input_tokens'] for r in runs),'output':sum(r['usage']['output_tokens'] for r in runs),'cached':sum(r['usage']['cached_input_tokens'] for r in runs),'seconds':round(sum(r['elapsed_seconds'] for r in runs),2),'median_seconds':statistics.median(r['elapsed_seconds'] for r in runs)}
    totals[mode]['total']=totals[mode]['input']+totals[mode]['output']
for run in data['runs']:
    text=re.sub(r'\s+','',(RUN/run['answer_file']).read_text(encoding='utf-8'))
    if run['task']=='sales':
        checks={term:term in text for term in ['100','120','20','20%','同比']}
    elif run['task']=='notice':
        checks={term:term in text for term in ['10月30日','22:00','23:00','登录','保存']}
    else:
        checks={term:term in text for term in ['6页','新员工','文档','报表','检索','备注']}
    quality.append({'answer':run['answer_file'],'required_terms':checks,'all_terms_present':all(checks.values()),'scope':'仅检查硬性内容出现，不是完整语义质量评分'})
summary={'totals':totals,'lean_vs_legacy_total_token_reduction_pct':round((1-totals['lean']['total']/totals['legacy']['total'])*100,2),'lean_vs_legacy_walltime_reduction_pct':round((1-totals['lean']['seconds']/totals['legacy']['seconds'])*100,2),'lean_vs_baseline_total_token_overhead_pct':round((totals['lean']['total']/totals['baseline']['total']-1)*100,2),'lean_vs_baseline_walltime_change_pct':round((totals['lean']['seconds']/totals['baseline']['seconds']-1)*100,2),'constraint_checks':quality}
(RUN/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='constraint_checks'},ensure_ascii=False))
print('Missing required terms: '+str([q for q in quality if not q['all_terms_present']]))
