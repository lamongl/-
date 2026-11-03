# Deliver Workbench

[Product website](https://lamongl.github.io/-/) · [Download v1.3.0](https://lamongl.github.io/-/downloads/deliver-workbench-v1.3.0.zip) · [中文](README.md)

An open-source Skill and local stdio MCP connector. Submit requirements and reference files in a local interface. Your current AI host reads the material, clarifies meaningful decisions, creates and checks actual deliverables, and returns downloadable files. No intermediate prompt copying is required.

The public website introduces the product and provides real output comparisons and downloads. It does not call your AI account. The user confirms developer testing in Codex, Tencent WorkBuddy, Doubao and DeepSeek Agent environments; installation entry points depend on host version. Your host provides model access, quota and artifact tools.

One universal ZIP is provided for capable file-and-command Agents. Give the whole archive to your Agent and say: “Read INSTALL.md in this archive and install Deliver Workbench in your current host.” The Agent identifies its host, installs dependencies, registers the Skill and connector, and runs the bundled verification script. Host-specific configuration is handled by the Agent; it may ask for required permissions or a connection refresh. See [Agent installation](skills/deliver-workbench/INSTALL.md).

Up to five input files, 20 MB each: DOCX, XLSX, XLS, PPTX, text PDF, TXT, MD and CSV. Scanned PDFs need OCR. Files are stored locally and processed by your AI host; cloud models may receive the material. Keep the host conversation active.

A single matched presentation trial found a modest improvement in defence readiness, especially evidence organization and reserve Q&A. Both arms met the requirements. Observed elapsed times included tool recovery and rework; they do not establish a stable speed gain. Subsequent session-counter inspection does not support a token-saving claim. [Outputs and methodology](https://lamongl.github.io/-/#results).

Local development: `npm ci`, `npm test`, `npm start`. Build: `npm run build` → `site-dist/`. License: MIT.
