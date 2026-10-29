"""Summarize only complete, requirement-passing paired component runs."""
import argparse
import json
from pathlib import Path

def summarize(directory):
    data=json.loads((directory/'results.json').read_text(encoding='utf-8'))
    totals={};pairs=[]
    for mode in ['baseline','route']:
        runs=[run for run in data['runs'] if run['mode']==mode]
        if len(runs)!=2 or any(run.get('status')!='completed' or not run.get('usage') or not run.get('grade',{}).get('passed') for run in runs):
            raise ValueError('Do not compare savings for incomplete or requirement-failing runs')
        totals[mode]={'tokens':sum(run['usage']['input_tokens']+run['usage']['output_tokens'] for run in runs),'input_tokens':sum(run['usage']['input_tokens'] for run in runs),'output_tokens':sum(run['usage']['output_tokens'] for run in runs),'seconds':round(sum(run['elapsed_seconds'] for run in runs),2),'tools':sum(run['tool_calls'] for run in runs),'failed_tools':sum(code!=0 for run in runs for code in run['tool_exit_codes']),'passes':[sum(run['grade']['checks'].values()) for run in runs]}
    for repeat in [1,2]:
        runs={run['mode']:run for run in data['runs'] if run['repeat']==repeat}
        values={mode:run['usage']['input_tokens']+run['usage']['output_tokens'] for mode,run in runs.items()}
        pairs.append({'repeat':repeat,**values,'token_reduction_pct':round((1-values['route']/values['baseline'])*100,2)})
    result={**totals,'token_reduction_pct':round((1-totals['route']['tokens']/totals['baseline']['tokens'])*100,2),'walltime_reduction_pct':round((1-totals['route']['seconds']/totals['baseline']['seconds'])*100,2),'pairs':pairs,'scope':'observations for one synthetic CSV component task; not a whole-product or independent quality improvement claim'}
    (directory/'summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--directory',required=True,type=Path)
    summarize(parser.parse_args().directory)
