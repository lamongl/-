"""Package the local delivery Skill/connector without user tasks or dependencies."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills/deliver-workbench"
FILES = {
    "SKILL.md": SKILL / "SKILL.md",
    "agents/openai.yaml": SKILL / "agents/openai.yaml",
    "references/setup.md": SKILL / "references/setup.md",
    "references/quality.md": SKILL / "references/quality.md",
    "LICENSE": ROOT / "LICENSE",
}
for relative in ["bridge/core.mjs", "bridge/server.mjs", "bridge/ui/index.html",
                 "bridge/ui/ui.mjs", "bridge/ui/ui.css", "web/core.mjs",
                 "web/attachments.mjs", "web/document-parser.mjs"]:
    FILES[relative] = ROOT / relative

version = "1.1.0"
source = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
manifest = {"name": "delivery-workbench", "version": version, "private": True,
            "type": "module", "license": "MIT", "engines": source["engines"],
            "scripts": {"start": "node bridge/server.mjs"},
            "dependencies": source["dependencies"]}
lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
lock["name"] = manifest["name"]
lock["version"] = version
lock["packages"][""] = {key: manifest[key] for key in
                         ["name", "version", "license", "dependencies", "engines"]}
output = ROOT / "release" / f"delivery-workbench-codex-v{version}.zip"
output.parent.mkdir(exist_ok=True)
prefix = "deliver-workbench/"
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    for relative, source_path in FILES.items():
        archive.write(source_path, prefix + relative)
    archive.writestr(prefix + "package.json", json.dumps(manifest, ensure_ascii=False, indent=2))
    archive.writestr(prefix + "package-lock.json", json.dumps(lock, ensure_ascii=False, indent=2))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist()) == {prefix + name for name in [*FILES, "package.json", "package-lock.json"]}
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix(".zip.sha256").write_text(digest + "  " + output.name + "\n", encoding="utf-8")
print(f"Created {output.name}: {len(FILES) + 2} allowlisted files; SHA256 {digest}")
