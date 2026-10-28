"""Create the distributable Skill ZIP from an explicit public-file allowlist."""
from pathlib import Path
import argparse
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = ["SKILL.md", "agents/openai.yaml", "references/evaluation.md", "references/deliverables.md"]

def package(output):
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for relative in FILES:
            source = ROOT / "skills/prompt-workbench" / relative
            archive.write(source, "prompt-workbench/" + relative)
        archive.write(ROOT / "LICENSE", "prompt-workbench/LICENSE")
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None or len(archive.namelist()) != 5:
            raise RuntimeError("Invalid Skill archive")
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix(".zip.sha256").write_text(digest + "  " + output.name + "\n", encoding="utf-8")
    print("Created " + output.name + "; SHA256 " + digest)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "release/prompt-workbench-v0.1.0.zip")
    package(parser.parse_args().output)
