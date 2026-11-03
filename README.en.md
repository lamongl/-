# Deliver Workbench

[Product website](https://lamongl.github.io/-/) · [Download v1.1.0](https://lamongl.github.io/-/downloads/delivery-workbench-codex-v1.1.0.zip) · [中文](README.md)

An open-source Skill and local stdio MCP connector. Submit requirements and reference files in a local interface. Your current AI host reads the material, clarifies meaningful decisions, creates and checks actual deliverables, and returns downloadable files. No intermediate prompt copying is required.

The public website introduces the product and provides real output comparisons and downloads. It does not call your AI account. The complete flow has been validated in Codex desktop; other hosts require separate compatibility checks. Your host provides model access, quota and artifact tools.

Install Node.js 22.13+, extract the downloadable `deliver-workbench` folder into `~/.codex/skills/`, run `npm ci` inside it, and configure:

```text
codex mcp add delivery_workbench -- <absolute-node-path> <absolute-extracted-folder/bridge/server.mjs>
```

Refresh the MCP connection or start a new conversation, verify the seven tools, then invoke `$deliver-workbench`. See [setup](skills/deliver-workbench/references/setup.md).

Up to five input files, 20 MB each: DOCX, XLSX, XLS, PPTX, text PDF, TXT, MD and CSV. Scanned PDFs need OCR. Files are stored locally and processed by your AI host; cloud models may receive the material. Keep the host conversation active.

A single matched presentation trial found a modest improvement in defence readiness, especially evidence organization and reserve Q&A. Both arms met the requirements. Observed elapsed times included tool recovery and rework; they do not establish a stable speed gain. Token consumption was not measured. [Outputs and methodology](https://lamongl.github.io/-/#results).

Local development: `npm ci`, `npm test`, `npm start`. Build: `npm run build` → `site-dist/`. License: MIT.
