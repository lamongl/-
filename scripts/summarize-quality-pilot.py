"""Recompute measurements only; deliberately produces no subjective quality score."""
from pathlib import Path
import argparse, json

parser = argparse.ArgumentParser()
parser.add_argument('--directory', type=Path, required=True)
args = parser.parse_args()
root = args.directory
data = json.loads((root / 'results.json').read_text(encoding='utf-8'))
assert len(data['runs']) == 8, 'Incomplete batch; do not compare aggregates'
totals = {}
for mode in ['baseline', 'skill']:
    runs = [r for r in data['runs'] if r['condition'] == mode]
    assert len(runs) == 4 and len({r['task'] for r in runs}) == 4
    assert all(r['status'] == 'completed' and r['usage'] for r in runs), 'Unknown usage or missed delivery'
    assert all(not r['tools'] for r in runs), 'Tools outside protocol'
    totals[mode] = {
        'input_tokens_including_cache': sum(r['usage']['input_tokens'] for r in runs),
        'output_tokens': sum(r['usage']['output_tokens'] for r in runs),
        'elapsed_seconds': round(sum(r['elapsed_seconds'] for r in runs), 2),
        'completed_under_60_seconds': sum(r['elapsed_seconds'] <= 60 for r in runs),
    }
    totals[mode]['total_tokens'] = totals[mode]['input_tokens_including_cache'] + totals[mode]['output_tokens']
lengths = []
for run in data['runs']:
    text = (root / run['answer_file']).read_text(encoding='utf-8')
    lengths.append({'answer': run['answer_file'], 'nonwhitespace_characters_including_markdown': sum(not c.isspace() for c in text)})
summary = {
    'totals': totals,
    'skill_total_token_increase_pct': round((totals['skill']['total_tokens'] / totals['baseline']['total_tokens'] - 1) * 100, 2),
    'skill_observed_walltime_reduction_pct': round((1 - totals['skill']['elapsed_seconds'] / totals['baseline']['elapsed_seconds']) * 100, 2),
    'lengths': lengths,
    'independent_review_completed': False,
    'quality_improvement_percent': None,
    'warning': 'One run per task; author review only; content-only. Counts/lengths/time are not overall quality scores.',
}
(root / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
