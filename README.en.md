# Prompt Workbench

An experimental open-source Codex Skill for everyday reports, documents, presentation content and research summaries. Quality and efficiency improvements have not been established.

[中文说明](README.md) · [Web demo](https://lamongl.github.io/-/) · [Install](docs/skill-release.md) · [Download Skill preview](https://github.com/lamongl/-/releases/tag/skill-v0.1.0) · [Benchmark pilot](docs/benchmarks/README.md)

Web v0.3 builds prompts locally with optional format/style preferences, existing source links and text attachments. Copy, TXT download and supported native text sharing are available, without accounts or input uploads. It does not run an AI model. [Features and release checks](docs/web-v0.3.md).

Web v0.4 adds distinct scenario examples and Chinese browser dictation. On-device recognition is requested by default; remote recognition requires opt-in and may send audio to the browser's service. This site stores no recordings. [Compatibility and validation limits](docs/web-v0.4.md).

## Install in Codex

Download the Skill ZIP from Releases. Extract the `prompt-workbench` folder into `~/.codex/skills/`, then start a new turn and invoke `$prompt-workbench` with your request. You can also ask Codex's skill-installer to install `skills/prompt-workbench` from this repository.

The host model and its available tools do the work. The project supplies no model API or inference quota. Other hosts supporting SKILL.md may work, but compatibility has not been verified.

## What it does

- Connects task goals, facts, audience, format and acceptance requirements.
- Asks one necessary question at a time.
- Instructs the host to generate at least 11 distinct candidates and review them before executing one plan.
- Supports a prompt-only mode when explicitly requested.
- Reports inaccessible materials and missing capabilities instead of claiming success.

## Latest comparison

A [local-calculation component trial](docs/benchmarks/2026-10-29-csv-complete/README.md) explores reducing temporary-code generation and retries. Both conditions passed all 17 checks twice. Aggregate savings were strongly affected by one retry, and Skill-loading overhead was not measured. The component remains experimental; this is not a product-wide performance claim.

In a second three-task comparison (two runs per condition per task), baseline, legacy and lean each met explicit requirements in 6/6 outputs. No quality improvement was demonstrated. Lean used 9.11% fewer reported total tokens than legacy, but 2.27% more than baseline; wall time was higher. Hidden-input variation also affected the trial. The lean candidate remains experimental and is not released as a proven efficiency gain. [Inspect the complete outputs and limitations](docs/benchmarks/2026-10-28-balanced/README.md).

## Earlier validation

Preview v0.1.0: installed locally and exercised on a synthetic sales report. In a paired pilot on three tasks using the same requested model (`gpt-6.1-terra`, medium), total reported tokens were **48,746 without the Skill and 55,144 with it: a 13.1% increase**. Wall time was **33.60s versus 33.95s**, so no aggregate speed improvement was observed. Output tokens decreased from 524 to 358 (31.7%), but this does not mean total usage or cost decreased.

Each task/mode was run only once. Cache/network conditions varied, human effort was not timed, and internal 11-candidate compliance was not observed. [Read the measurement method and raw usage](docs/benchmarks/README.md). Candidate review is performed by the same model and is not independently enforced.

The website is a separate local-rules demonstration, not a live model service. Cloud hosts may process your input. No project API key, analytics or automatic document upload is included in the Skill.

MIT licensed. Use synthetic or redacted data when opening an issue.
