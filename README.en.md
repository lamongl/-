# Deliver Workbench

[Product website](https://lamongl.github.io/-/) · [Download v1.4.0](https://lamongl.github.io/-/deliver-workbench/SKILL.md) · [中文](README.md)

An open-source Skill and local stdio MCP connector. Submit requirements and reference files in a local interface. Your current AI host reads the material, clarifies meaningful decisions, creates and checks actual deliverables, and returns downloadable files. No intermediate prompt copying is required.

The public website introduces the product and provides real output comparisons and downloads. It does not call your AI account. The user confirms developer testing in Codex, Tencent WorkBuddy, Doubao and DeepSeek Agent environments; installation entry points depend on host version. Your host provides model access, quota and artifact tools.

Start with the [Markdown installation guide](https://lamongl.github.io/-/deliver-workbench/INSTALL.md).

Up to five input files, 20 MB each: DOCX, XLSX, XLS, PPTX, text PDF, TXT, MD and CSV. Scanned PDFs need OCR. Files are stored locally and processed by your AI host; cloud models may receive the material. Keep the host conversation active.

A single matched presentation trial found a modest improvement in defence readiness, especially evidence organization and reserve Q&A. Both arms met the requirements. Observed elapsed times included tool recovery and rework; they do not establish a stable speed gain. Subsequent session-counter inspection does not support a token-saving claim. [Outputs and methodology](https://lamongl.github.io/-/#results).

Local development: `npm ci`, `npm test`, `npm start`. Build: `npm run build` → `site-dist/`. License: MIT.

Version 1.4 prioritises native MCP setup and actual host-tool verification. A server self-test is reported separately. The local CLI is an explicit user-selected fallback for file-and-command Agents, sharing the same question and delivery logic. Native Doubao stdio registration still requires verification in its client. See INSTALL.md for Markdown extraction and lock-preserving dependency recovery.
